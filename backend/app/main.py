from __future__ import annotations

import difflib
import io
import os
import re
import uuid
from datetime import datetime
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    import fitz
except ImportError:
    fitz = None
try:
    from docx import Document as DocxDocument
except ImportError:
    DocxDocument = None

app = FastAPI(title="NyayLens API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_methods=["*"], allow_headers=["*"])

DOCUMENTS: dict[str, dict[str, Any]] = {}

SAMPLE_TEXT = """EMPLOYMENT AGREEMENT\nBetween Northstar Labs and Asha Mehta\nEffective date: 12 August 2025\n\n1. Compensation\nThe Company will pay the Employee INR 20,000 per month, paid on the last working day of each month.\n\n2. Working hours\nThe Employee will work 40 hours per week, Monday through Friday.\n\n3. Leave\nThe Employee may take 18 days of paid leave each year with reasonable prior notice.\n\n4. Confidentiality\nThe Employee shall keep confidential all non-public business, customer, and technical information during and after employment.\n\n5. Intellectual property\nWork product created in the course of employment belongs to Northstar Labs.\n\n6. Termination\nEither party may terminate this agreement by giving written notice.\n\n7. Dispute resolution\nThe parties will first attempt to resolve disputes through good-faith discussion.\n\n8. Notice requirement\nThe Employee shall provide thirty days prior written notice before leaving the Company.\n\n9. Company property\nThe Employee must return company property at the end of employment.\n"""


def sample_analysis(document_id: str, filename: str = "Employment Agreement.txt") -> dict[str, Any]:
    return {
        "id": document_id, "filename": filename, "type": "Employment Agreement", "page_count": 9,
        "preview": "An agreement between Northstar Labs and Asha Mehta covering compensation, responsibilities, confidentiality, and termination.",
        "parties": "Northstar Labs and Asha Mehta", "effective_date": "12 Aug 2025", "expiry_date": "Not specified",
        "summary": "This employment agreement describes monthly compensation, working expectations, confidentiality, ownership of work product, leave, and how either party can end the relationship. The clearest time-sensitive requirement is thirty days' written notice before leaving.",
        "clauses": [
            {"id":"notice","title":"30-Day Notice Requirement","category":"High Attention","section":"Section 8","page":7,"original":"The Employee shall provide thirty days prior written notice before leaving the Company.","simple":"You generally need to tell the company in writing at least 30 days before leaving.","why":"This sets a notice period for the employee's departure.","question":"What should be confirmed about the notice period and the effective date of resignation?"},
            {"id":"pay","title":"Monthly Compensation","category":"Important","tone":"yellow","section":"Section 1","page":1,"original":"The Company will pay the Employee INR 20,000 per month, paid on the last working day of each month.","simple":"Your stated monthly pay is INR 20,000, scheduled for the last working day of each month.","why":"This records the payment amount and timing in the agreement.","question":"Are there other compensation terms or deductions that should be documented?"},
            {"id":"ip","title":"Work Product Ownership","category":"Review Carefully","tone":"orange","section":"Section 5","page":5,"original":"Work product created in the course of employment belongs to Northstar Labs.","simple":"Work you create as part of this job is assigned to the company.","why":"The wording relates to intellectual property created during employment.","question":"How is work created outside working hours or with personal resources treated?"},
            {"id":"conf","title":"Continuing Confidentiality","category":"Important","tone":"yellow","section":"Section 4","page":4,"original":"The Employee shall keep confidential all non-public business, customer, and technical information during and after employment.","simple":"You are expected to protect non-public information while working there and after employment ends.","why":"This obligation continues beyond the employment period.","question":"What information is considered confidential and how long does this continue?"}
        ],
        "obligations": [{"text":"Submit written termination notice","party":"Employee","deadline":"30 days before leaving","source":"Section 8 · Page 7","status":"Pending"},{"text":"Return company property","party":"Employee","deadline":"At end of employment","source":"Section 9 · Page 9","status":"Pending"},{"text":"Protect non-public information","party":"Employee","deadline":"During and after employment","source":"Section 4 · Page 4","status":"Pending"}],
        "timeline": [{"date":"12 Aug 2025","event":"Agreement begins","detail":"The stated effective date of the agreement.","source":"Opening details · Page 1"},{"date":"Monthly","event":"Payment due","detail":"Monthly compensation is scheduled for the last working day.","source":"Section 1 · Page 1"},{"date":"30 days before leaving","event":"Notice deadline","detail":"Written notice is described as due before departure.","source":"Section 8 · Page 7"}],
        "text": SAMPLE_TEXT,
    }


PARTY_LINE = re.compile(r"^\s*(Employee|Employer|Company|Tenant|Landlord|Client|Contractor|Buyer|Seller)\s*:\s*(.*?)\s*$", re.I)
ACTOR_AT_START = re.compile(r"^\s*(?:the\s+)?(employee|employer|company|tenant|landlord|client|contractor|buyer|seller)\b", re.I)
MONTH_PATTERN = r"January|February|March|April|May|June|July|August|September|October|November|December"
DATE_PATTERN = re.compile(rf"\b(?:\d{{1,2}}(?:st|nd|rd|th)?\s+(?:{MONTH_PATTERN})\s+\d{{4}}|(?:{MONTH_PATTERN})\s+\d{{1,2}}(?:st|nd|rd|th)?[,]?\s+\d{{4}}|\d{{1,2}}[/-]\d{{1,2}}[/-]\d{{2,4}})\b", re.I)


def _build_chunks(document_id: str, page_texts: list[str]) -> list[dict[str, Any]]:
    chunks = []
    for page_number, page_text in enumerate(page_texts, 1):
        start = 0
        for separator in re.finditer(r"\r?\n[ \t]*\r?\n+", page_text):
            end = separator.end()
            chunk_text = page_text[start:end]
            if chunk_text.strip():
                chunks.append({"document_id": document_id, "chunk_id": f"{document_id}-chunk-{len(chunks) + 1}", "text": chunk_text, "page": page_number, "section": f"Paragraph {len(chunks) + 1}"})
            start = end
        chunk_text = page_text[start:]
        if chunk_text.strip():
            chunks.append({"document_id": document_id, "chunk_id": f"{document_id}-chunk-{len(chunks) + 1}", "text": chunk_text, "page": page_number, "section": f"Paragraph {len(chunks) + 1}"})
    return chunks


def _chunk_for_text(sentence: str, chunks: list[dict[str, Any]]) -> dict[str, Any]:
    return next((chunk for chunk in chunks if sentence in chunk["text"]), {"page": 1, "section": "Extracted text"})


def _source_for(sentence: str, chunks: list[dict[str, Any]]) -> tuple[str, dict[str, Any]]:
    chunk = _chunk_for_text(sentence, chunks)
    return f"Extracted text · Page {chunk['page']}", chunk


def _responsible_party(sentence: str) -> str:
    if re.search(r"\beither\s+party\b", sentence, re.I):
        return "Either party"
    match = ACTOR_AT_START.match(sentence)
    return match.group(1).title() if match else "Not specified"


def _deadline_in(sentence: str) -> str:
    match = re.search(r"\bwithin\s+(\d+\s+(?:business\s+|calendar\s+)?days?(?:\s+after\s+(?:termination|expiry|expiration|the\s+end\s+of\s+employment))?)", sentence, re.I)
    if match:
        return "Within " + match.group(1)
    match = re.search(r"\b(\d+\s+(?:business\s+|calendar\s+)?days?\s+before\s+(?:the\s+)?(?:expiry|expiration))\b", sentence, re.I)
    if match:
        return match.group(1)
    match = re.search(r"\b(\d+\s+(?:business\s+|calendar\s+)?days?)\s+(?:written\s+)?notice\b", sentence, re.I)
    if match:
        return match.group(1)
    if re.search(r"\bduring\s+and\s+after\s+employment\b", sentence, re.I):
        return "During and after employment"
    return "Not specified"


def _obligation_text(sentence: str) -> str:
    action = re.sub(r"^\s*(?:the\s+)?(?:employee|employer|company|tenant|landlord|client|contractor|buyer|seller)\s+(?:must|shall|is\s+required\s+to|are\s+required\s+to)\s+", "", sentence, flags=re.I)
    deadline_match = re.search(r"\b(?:within\s+\d+\s+(?:business\s+|calendar\s+)?days?(?:\s+after\s+[^,.]+)?|during\s+and\s+after\s+employment)\b", action, re.I)
    if deadline_match:
        action = action[:deadline_match.start()]
    action = action.strip(" .;,:\n")
    return action[:1].upper() + action[1:] if action else sentence


def _effective_date(text: str) -> str:
    phrase = re.search(r"\b(?:(?:employment|agreement)\s+)?(?:begins|starts|commences)\s+on\b|\bcommencing\s+on\b|\beffective(?:\s+date)?(?:\s+(?:is|from|on))?\s*[:\-]?", text, re.I)
    if not phrase:
        return "Not specified"
    date = DATE_PATTERN.search(text[phrase.end():phrase.end() + 100])
    return date.group(0) if date else "Not specified"


def _extract_timeline(sentences: list[str], effective_date: str, chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    timeline = []
    if effective_date != "Not specified":
        sentence = next((item for item in sentences if re.search(r"\b(?:begins|starts|commences|effective)\b", item, re.I) and effective_date.lower() in item.lower()), effective_date)
        source, chunk = _source_for(sentence, chunks)
        timeline.append({"date": effective_date, "event": "Employment begins", "detail": "Employment begins on the date stated in the document.", "party": "Employee", "source": source, "section": chunk["section"], "original": sentence})

    for sentence in sentences:
        duration = _deadline_in(sentence)
        source, chunk = _source_for(sentence, chunks)
        base = {"detail": "Time-bound requirement identified in the supporting clause.", "party": _responsible_party(sentence), "source": source, "section": chunk["section"], "original": sentence}
        if re.search(r"\b(terminate|termination)\b", sentence, re.I) and re.search(r"\bnotice\b", sentence, re.I) and duration != "Not specified":
            timeline.append({"date": duration, "event": "Termination notice", **base})
        if re.search(r"\breturn\b.*\bcompany\s+property\b", sentence, re.I) and duration.lower().startswith("within "):
            timeline.append({"date": duration, "event": "Return company property", **base})
        if re.search(r"\brenew", sentence, re.I) and re.search(r"\bnotice\b", sentence, re.I) and "before" in duration.lower():
            timeline.append({"date": duration, "event": "Renewal notice", **base})
    return timeline


def analyze_text(text: str, filename: str, page_count: int = 1, page_texts: list[str] | None = None, document_id: str | None = None) -> dict[str, Any]:
    document_id = document_id or str(uuid.uuid4())
    chunks = _build_chunks(document_id, page_texts or [text])
    sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+|\n+", text) if len(part.strip()) > 20]
    review_terms = re.compile(r"notice|terminat|payment|salary|rent|deposit|confidential|intellectual|renew|liabilit|penalt|shall|must|required|deadline|due", re.I)
    selected = [sentence for sentence in sentences if review_terms.search(sentence)][:6]
    if not selected:
        selected = sentences[:3]

    clauses = []
    for index, sentence in enumerate(selected, 1):
        source, chunk = _source_for(sentence, chunks)
        clauses.append({
            "id": f"clause-{index}", "title": " ".join(sentence.split()[:7]).rstrip(".,;:") + "…",
            "category": "Review Carefully", "section": chunk["section"], "page": chunk["page"],
            "original": sentence, "simple": f"This section states: {sentence}",
            "why": "This wording may describe a right, responsibility, payment, or time limit in the document.",
            "question": "What details or exceptions should be confirmed with a qualified legal professional?",
        })

    obligations = []
    for sentence in sentences:
        if re.search(r"\b(shall|must|required to|is responsible for|are responsible for)\b", sentence, re.I):
            source, chunk = _source_for(sentence, chunks)
            obligations.append({"text": _obligation_text(sentence), "party": _responsible_party(sentence), "deadline": _deadline_in(sentence), "source": source, "section": chunk["section"], "original": sentence, "status": "Pending"})
        if len(obligations) == 8:
            break

    party_values = {}
    for line in text.splitlines():
        match = PARTY_LINE.match(line)
        if match and match.group(2):
            party_values.setdefault(match.group(1).title(), match.group(2))
    parties = " · ".join(f"{role} → {name}" for role, name in party_values.items()) or "Not specified"
    effective_date = _effective_date(text)
    timeline = _extract_timeline(sentences, effective_date, chunks)
    summary_sentences = [sentence for sentence in sentences if not PARTY_LINE.match(sentence) and not re.fullmatch(r"[A-Z][A-Z ]{2,}", sentence)]
    summary = " ".join(summary_sentences[:3])[:700] or "No readable text was extracted from this document."
    return {
        "id": document_id, "filename": filename, "type": filename.rsplit(".", 1)[-1].upper() + " document" if "." in filename else "Document",
        "page_count": page_count, "preview": text[:240], "parties": parties, "effective_date": effective_date,
        "expiry_date": "Not specified", "summary": summary, "clauses": clauses, "obligations": obligations,
        "timeline": timeline, "text": text, "chunks": chunks, "demo": False,
    }


def get_or_create_demo() -> dict[str, Any]:
    existing = next((item for item in DOCUMENTS.values() if item.get("demo")), None)
    if existing:
        return existing
    doc = sample_analysis("demo-employment")
    doc["demo"] = True
    DOCUMENTS[doc["id"]] = doc
    return doc


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "demo" if not os.getenv("GEMINI_API_KEY") else "gemini-ready"}


@app.get("/api/demo/employment")
def employment_demo() -> dict[str, Any]:
    return get_or_create_demo()


@app.get("/api/documents")
def list_documents() -> list[dict[str, Any]]:
    return [{k: v for k, v in doc.items() if k not in {"text", "chunks"}} for doc in DOCUMENTS.values()]


@app.delete("/api/documents")
def clear_documents() -> dict[str, str]:
    DOCUMENTS.clear()
    return {"status": "cleared"}


@app.get("/api/documents/{document_id}")
def get_document(document_id: str) -> dict[str, Any]:
    document = DOCUMENTS.get(document_id)
    if not document:
        raise HTTPException(404, "Document not found.")
    return document


async def extract_file(filename: str, content: bytes) -> tuple[str, int, list[str]]:
    suffix = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if suffix == "txt":
        page_texts = [content.decode("utf-8", errors="ignore")]
        return page_texts[0], 1, page_texts
    if suffix == "pdf" and fitz:
        pdf = fitz.open(stream=content, filetype="pdf")
        page_texts = [page.get_text() for page in pdf]
        return "\n".join(page_texts), len(pdf), page_texts
    if suffix == "docx" and DocxDocument:
        doc = DocxDocument(io.BytesIO(content))
        page_texts = ["\n".join(paragraph.text for paragraph in doc.paragraphs)]
        return page_texts[0], 1, page_texts
    raise HTTPException(400, "That file type is not supported. Please use a PDF, DOCX, or TXT file.")


@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.filename or "." not in file.filename:
        raise HTTPException(400, "Please upload a PDF, DOCX, or TXT document.")
    content = await file.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(413, "This document is larger than the 15 MB development limit.")
    text, page_count, page_texts = await extract_file(file.filename, content)
    if not text.strip():
        raise HTTPException(422, "We couldn't extract readable text from this document. Try a text-based PDF or DOCX.")
    document_id = str(uuid.uuid4())
    doc = analyze_text(text, file.filename, page_count, page_texts, document_id)
    DOCUMENTS[document_id] = doc
    return doc


class Question(BaseModel):
    question: str


@app.post("/api/documents/{document_id}/ask")
def ask_document(document_id: str, payload: Question) -> dict[str, Any]:
    doc = DOCUMENTS.get(document_id) or (get_or_create_demo() if document_id == "demo-employment" else None)
    if not doc:
        raise HTTPException(404, "Document not found.")
    stop_words = {"what", "when", "where", "which", "who", "how", "does", "do", "the", "and", "for", "from", "this", "that", "with", "about", "are", "can", "need", "have", "i", "my", "to", "is", "in", "on", "of", "it", "employee", "employer", "agreement", "document", "annual", "tell", "me", "please", "period"}

    def canonical(word: str) -> str:
        if word.startswith("terminat"):
            return "termination"
        if word.startswith("salari"):
            return "salary"
        if word.startswith("return"):
            return "return"
        if word.startswith("pay"):
            return "pay"
        if word.startswith("bonus"):
            return "bonus"
        return word

    question_terms = {canonical(word) for word in re.findall(r"[a-z]{3,}", payload.question.lower()) if word not in stop_words}
    chunks = doc.get("chunks") or _build_chunks(document_id, [doc.get("text", "")])
    ranked = []
    for chunk in chunks:
        chunk_terms = {canonical(word) for word in re.findall(r"[a-z]{3,}", chunk["text"].lower())}
        score = len(question_terms & chunk_terms)
        if score:
            ranked.append((score, chunk))
    threshold = min(2, len(question_terms))
    relevant = [item for item in ranked if item[0] >= threshold]
    limitations = "Answers use relevant extracted document text only and may miss context. This is informational, not legal advice."
    if not relevant:
        if re.search(r"\bbonus\b", payload.question, re.I) and not any(re.search(r"\bbonus\b", chunk["text"], re.I) for chunk in chunks):
            answer = "The uploaded document does not mention an annual bonus."
        else:
            answer = "The uploaded document does not contain enough information to answer this question reliably."
        return {"answer": answer, "sources": [], "confidence": "Low", "limitations": limitations}

    match = max(relevant, key=lambda item: item[0])[1]
    evidence = match["text"].strip()
    question_lower = payload.question.lower()
    amount = re.search(r"₹\s*[\d,]+(?:\.\d+)?", evidence)
    if amount and re.search(r"salary|compensation|pay|wage", question_lower):
        answer = amount.group(0) + (" per month." if re.search(r"monthly|per month", evidence, re.I) else ".")
    elif re.search(r"termination|terminate", question_lower) and re.search(r"notice", question_lower):
        duration = re.search(r"\b\d+\s+(?:business\s+|calendar\s+)?days?\b", evidence, re.I)
        answer = duration.group(0) + "." if duration else evidence
    elif re.search(r"return", question_lower) and re.search(r"property", question_lower):
        deadline = re.search(r"within\s+\d+\s+(?:business\s+|calendar\s+)?days?(?:\s+after\s+(?:termination|expiry|expiration))?", evidence, re.I)
        answer = deadline.group(0)[:1].upper() + deadline.group(0)[1:] + "." if deadline else evidence
    else:
        answer = evidence
    return {"answer": answer, "sources": [f"Extracted text · Page {match['page']}"], "confidence": "High", "limitations": limitations}


@app.get("/api/demo/compare")
def demo_compare() -> dict[str, str]:
    first = sample_analysis("demo-employment-v1", "Employment Agreement · Contract v1")
    second = sample_analysis("demo-employment-v2", "Employment Agreement · Contract v2")
    first["text"] = SAMPLE_TEXT
    second["text"] = SAMPLE_TEXT.replace("INR 20,000", "INR 25,000").replace("thirty days", "sixty days")
    DOCUMENTS[first["id"]] = first
    DOCUMENTS[second["id"]] = second
    return {"a": first["id"], "b": second["id"]}


class CompareRequest(BaseModel):
    document_a: str
    document_b: str


@app.post("/api/compare")
def compare_documents(payload: CompareRequest) -> dict[str, Any]:
    first = DOCUMENTS.get(payload.document_a)
    second = DOCUMENTS.get(payload.document_b)
    if not first or not second:
        raise HTTPException(404, "Both documents must be uploaded or loaded into the workspace before comparison.")

    text_a = [line.strip() for line in re.split(r"(?<=[.!?])\s+|\n+", first.get("text", "")) if line.strip()]
    text_b = [line.strip() for line in re.split(r"(?<=[.!?])\s+|\n+", second.get("text", "")) if line.strip()]
    changes = []
    counts = {"added": 0, "removed": 0, "modified": 0}
    for operation, start_a, end_a, start_b, end_b in difflib.SequenceMatcher(a=text_a, b=text_b).get_opcodes():
        if operation == "equal":
            continue
        old_text = " ".join(text_a[start_a:end_a]) or "Not present"
        new_text = " ".join(text_b[start_b:end_b]) or "Not present"
        change_type = {"replace": "Modified", "delete": "Removed", "insert": "Added"}[operation]
        counts[change_type.lower()] += 1
        context = old_text if old_text != "Not present" else new_text
        category = "Money" if re.search(r"\b(INR|USD|EUR|\$|\d+[,.]?\d*)\b", context, re.I) else "Dates" if re.search(r"\b(day|month|year|January|February|March|April|May|June|July|August|September|October|November|December)\b", context, re.I) else "Other change"
        changes.append({"title": context[:80], "old": old_text, "new": new_text, "type": change_type, "category": category, "source": "Document text", "detail": "Text differs between the selected documents; verify the surrounding context."})

    return {"summary": f"{len(changes)} text change{'s' if len(changes) != 1 else ''} detected", "counts": counts, "changes": changes[:20], "questions": ["Do these changes affect obligations, payment, or timing?", "Are there related clauses elsewhere in either document?"]}
