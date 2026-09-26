"""Provider boundary for document analysis.

The app currently uses deterministic local analysis when GEMINI_API_KEY is absent.
Gemini calls can be added behind these focused functions without changing routes.
"""

from __future__ import annotations

import os
from typing import Any

DEMO_MODE = not bool(os.getenv("GEMINI_API_KEY"))


def _demo_notice() -> str:
    return "Demo mode is active. This response is grounded in the uploaded document and is not legal advice."


def analyze_document(text: str, metadata: dict[str, Any]) -> dict[str, Any]:
    return {"mode": "demo" if DEMO_MODE else "gemini", "summary": text[:500], "notice": _demo_notice()}


def simplify_clause(clause: str, context: str = "") -> dict[str, str]:
    return {"explanation": clause, "notice": _demo_notice()}


def extract_obligations(text: str) -> list[dict[str, str]]:
    return []


def extract_deadlines(text: str) -> list[dict[str, str]]:
    return []


def answer_question(question: str, context: str) -> dict[str, Any]:
    return {"answer": "I couldn't find enough information in the uploaded document to answer this reliably.", "sources": [], "confidence": "Low", "limitations": _demo_notice()}


def compare_documents(document_a: str, document_b: str) -> dict[str, Any]:
    return {"changes": [], "notice": _demo_notice()}


def generate_action_plan(analysis: dict[str, Any]) -> list[str]:
    return ["Review the document findings", "Confirm missing information", "Prepare questions for a qualified legal professional"]


def prepare_for_lawyer(analysis: dict[str, Any]) -> dict[str, Any]:
    return {"questions": [], "documents_to_bring": [], "notice": _demo_notice()}
