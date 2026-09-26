# ⚖️ NyayLens — Legal Document Intelligence & Action Planner

> **Understand. Detect. Compare. Ask. Act.**

NyayLens is a local-first legal document intelligence demo designed to make complex legal documents easier to understand and navigate. Its current analysis uses deterministic text extraction and matching; an external generative AI provider is not connected.

Instead of functioning as a generic chatbot, NyayLens works directly with uploaded documents to extract important information, identify obligations and deadlines, answer document-grounded questions, compare document versions, and organize practical next steps.

---

## 🚀 Why NyayLens?

Legal documents often contain important information across lengthy clauses, formal language, deadlines, obligations, and multiple versions.

For a non-legal user, questions such as:

* What are my obligations?
* What is the notice period?
* When do I need to take action?
* What changed between two versions?
* Does this document mention a particular term?
* What should I discuss with a lawyer?

can be difficult to answer quickly and reliably.

### NyayLens turns a legal document into a structured, interactive workspace.

```text
                 ┌─────────────────────┐
                 │   Upload Document   │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │ Extract & Understand│
                 └──────────┬──────────┘
                            ↓
          ┌─────────────────┼─────────────────┐
          ↓                 ↓                 ↓
     Important          Obligations       Timeline
       Clauses
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ↓
                    ┌───────────────┐
                    │    Ask AI     │
                    │ Grounded Q&A  │
                    └───────┬───────┘
                            ↓
                 ┌─────────────────────┐
                 │ Compare Documents   │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │    Action Plan      │
                 └─────────────────────┘
```

---

# ✨ Key Features

## 📄 1. Legal Document Upload & Preview

Upload supported legal documents and inspect their extracted text before analysis.

Supported formats include:

* `.txt`
* `.pdf`
* `.docx`

NyayLens provides a readable document preview while preserving the extracted document content.

---

## 🧠 2. Local Document Analysis

NyayLens analyzes uploaded documents and extracts information such as:

* Parties
* Important dates
* Important clauses
* Obligations
* Time-bound requirements
* Executive summary

Example:

```text
Employee → Ananya Sharma
Company  → Example Technologies

Effective Date
→ 1 October 2026
```

---

## 🔎 3. Important Clause Detection

NyayLens highlights clauses that may require closer review.

For example:

> The employee will receive a monthly salary of ₹40,000.

and:

> Either party may terminate this agreement by providing 30 days written notice.

Users can inspect the supporting document text rather than relying only on an AI-generated summary.

---

## ✅ 4. Obligation Extraction

Legal obligations are transformed into a structured format.

| Obligation                            | Responsible | Deadline                        | Status  |
| ------------------------------------- | ----------- | ------------------------------- | ------- |
| Return company property               | Employee    | Within 7 days after termination | Pending |
| Keep confidential information private | Employee    | During and after employment     | Pending |

This helps users identify **who needs to do what and when**.

---

## ⏱️ 5. Legal Timeline

NyayLens extracts explicit dates and relative time requirements from the document.

Example:

```text
1 October 2026
→ Employment begins

30 days
→ Termination notice

Within 7 days after termination
→ Return company property

30 days before expiry
→ Renewal notice
```

Relative deadlines are preserved when the document does not provide enough information to calculate an exact calendar date.

---

## 💬 6. Grounded Ask AI

Users can ask questions about the uploaded document.

### Example

**Question:**

> What is the monthly salary?

**Answer:**

> ₹40,000 per month.

---

**Question:**

> When must the employee return company property?

**Answer:**

> Within 7 days after termination.

Answers are accompanied by supporting evidence from the uploaded document.

### Unknown Information Handling

NyayLens is designed to avoid guessing when information is not present.

For example:

> What is the employee's annual bonus?

The system can indicate that the uploaded document does not mention an annual bonus.

This helps reduce unsupported answers during document Q&A.

---

# 🔄 7. Document Comparison

NyayLens can compare two versions of a document and identify text changes.

Example:

### Salary

```text
₹40,000  →  ₹50,000
```

### Notice Period

```text
30 days  →  60 days
```

Changes are surfaced with their surrounding document context so users can review what actually changed.

---

# 📋 8. Action Plan

NyayLens converts document analysis into a practical review checklist.

Example:

* Review the termination clause
* Confirm the notice deadline
* Check the monthly payment obligation
* Review the confidentiality requirement
* Write down missing information

Users can track their progress through the checklist.

---

# 👩‍⚖️ 9. Legal Consultation Preparation

NyayLens includes a preparation workflow for organizing information before speaking with a qualified legal professional.

It can organize:

* Important information
* Questions to discuss
* Relevant documents
* Missing information to collect

The purpose is to help users prepare for a consultation rather than replace professional legal advice.

---

# 🛡️ Responsible AI & Safety

NyayLens focuses on **document-grounded information rather than unsupported legal conclusions**.

The system is designed to:

* Use information from the uploaded document
* Preserve supporting evidence
* Avoid inventing missing information
* Preserve relative deadlines when exact dates cannot be determined
* Indicate when the document does not contain enough information
* Encourage consultation with a qualified legal professional

### Important Disclaimer

> **NyayLens provides document-based information for educational purposes and does not replace advice from a qualified legal professional.**

NyayLens does **not** determine whether a user should sign a contract, guarantee legal outcomes, or replace professional legal advice.

## Prototype Authentication and Data Safety

The current email/password flow is demo authentication implemented in the browser. Passwords are stored as salted PBKDF2 hashes in local storage, while the profile-only session is held in session storage. Browser storage is user-editable and is not server-verified; this is not production authentication and must not protect real accounts or confidential data. All accounts in this prototype also share the local development API's in-memory document workspace. Use a server-side identity provider and per-user authorization before deployment.

---

# 🏗️ System Architecture

```text
                         USER
                           │
                           ▼
                 ┌───────────────────┐
                 │   React Frontend  │
                 │   Web Interface   │
                 └─────────┬─────────┘
                           │
                           │ API Requests
                           ▼
                 ┌───────────────────┐
                 │    FastAPI API    │
                 │     Backend       │
                 └─────────┬─────────┘
                           │
             ┌─────────────┼──────────────┐
             ▼             ▼              ▼
       Document        Analysis        Retrieval
       Extraction      Pipeline         / Q&A
             │             │              │
             └─────────────┼──────────────┘
                           ▼
                    Structured Results
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
       Overview       Obligations        Timeline
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                       Ask AI
                           │
                           ▼
                  Evidence-Based Answer
```

---

# 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* CSS

### Backend

* Python
* FastAPI
* Uvicorn

### AI / NLP

* Deterministic keyword and regular-expression extraction
* Document-grounded question answering with relevance matching
* Text-based version comparison

### Document Processing

* TXT
* PDF
* DOCX

### Development

* Git
* GitHub
* VS Code

---

# 📂 Project Structure

```text
NyayLens/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── services/
│   │   └── __init__.py
│   │
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── samples/
│
├── employment_agreement.txt
├── employment_agreement_v2.txt
├── .env.example
├── .gitignore
├── package-lock.json
└── README.md
```

---

# ⚙️ Local Setup

## 1. Clone the repository

```bash
git clone https://github.com/Jagriti-student/NyayLens.git
cd NyayLens
```

---

## 2. Backend Setup

Navigate to the backend:

```powershell
cd backend
```

Create a virtual environment:

```powershell
python -m venv venv
```

Activate it:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

No API key is required for the current deterministic demo. Setting `GEMINI_API_KEY` does not connect a generative AI provider.

Start the backend:

```powershell
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

---

## 3. Frontend Setup

Open a new terminal.

From the project root:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Run the frontend unit tests from the same `frontend` directory:

```powershell
npm test
```

Open the local URL displayed by Vite, typically:

```text
http://localhost:5173
```

---

# 🧪 Demo Scenario

A sample employment agreement can be used to demonstrate the complete workflow.

### Example extracted information

```text
Employee:
Ananya Sharma

Company:
Example Technologies

Salary:
₹40,000/month

Start Date:
1 October 2026

Notice Period:
30 days

Company Property:
Return within 7 days after termination

Renewal:
30 days before expiry

Confidentiality:
During and after employment
```

### Example AI questions

```text
What is the monthly salary?

What is the termination notice period?

When must the employee return company property?

What is the employee's annual bonus?
```

The last question demonstrates how NyayLens handles information that is not present in the document.

---

# 🎥 Demo Flow

```text
Upload
   ↓
Document Analysis
   ↓
Important Clauses
   ↓
Obligations
   ↓
Timeline
   ↓
Ask AI
   ↓
Unknown Information Handling
   ↓
Compare Versions
   ↓
Action Plan
```

---

# 🌱 Future Scope

Potential future improvements include:

* Multilingual legal document explanations
* More advanced clause classification
* Citation-level evidence highlighting
* Improved semantic document comparison
* Version history
* Secure document storage
* OCR for scanned documents
* Support for complex legal document structures
* Jurisdiction-aware legal information retrieval
* More sophisticated document-grounded retrieval
* Exportable consultation summaries

---

# 👤 Author

**Jagriti**

B.Tech Computer Science & Engineering



---

# 📜 Disclaimer

NyayLens is an educational and document-intelligence project.

It does not provide legal advice, does not establish an attorney-client relationship, and should not be used as a substitute for advice from a qualified legal professional.

Users should independently verify important legal information and consult a qualified professional for decisions involving their legal rights or obligations.

---

# ⭐ Project Vision

> **Make legal information easier to understand, easier to navigate, and easier to discuss with the right professional.**

## NyayLens

**Understand. Detect. Compare. Ask. Act.**
