# NyayLens

**Understand the fine print. Before it becomes a problem.**

NyayLens is a legal document intelligence workspace for plain-language explanations, source-linked findings, obligations, deadlines, comparisons, action planning, and legal consultation preparation. It provides document analysis and legal information, not legal advice.

## Features

- PDF, DOCX, and TXT upload with server-side text extraction
- Demo mode with fictional employment, rental, and freelance agreement flows
- Source-linked clause explanations, obligation tracking, and timeline extraction
- Document-grounded Q&A with confidence and limitations
- Version comparison showing factual changes in money, dates, and renewal terms
- Action checklist and lawyer preparation view
- Responsive workspace with mobile navigation and accessible controls

## Architecture

```text
React + TypeScript + Vite
          |
       REST API
          |
FastAPI + local in-memory document store
          |
PyMuPDF / python-docx / TXT extraction
          |
Focused AI service boundary (Gemini-ready, demo fallback)
```

## Setup

### Environment

The app runs locally in deterministic demo mode without an API key. Uploaded files are held in backend memory and are cleared when the backend restarts. The current analyzer is a local text-based demo, not a production legal-analysis or Gemini integration.

### Frontend

In a second PowerShell terminal, from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

### Backend

In the first PowerShell terminal, from the project root:

```powershell
py -m venv .venv  # Skip if .venv already exists
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
python -m uvicorn backend.app.main:app --reload --port 8000
```

The API runs at `http://localhost:8000` and exposes Swagger at `/docs`.

### Demo materials

Fictional upload-ready documents are in [`samples/`](samples/). For a version comparison, upload both `employment_agreement_v1.txt` and `employment_agreement_v2.txt`, then choose them on the Compare page. [`samples/DEMO_SCRIPT.md`](samples/DEMO_SCRIPT.md) contains a short recording flow.

## API endpoints

- `GET /api/health`
- `GET /api/documents`
- `GET /api/documents/{document_id}`
- `POST /api/documents/upload`
- `POST /api/documents/{document_id}/ask`
- `GET /api/demo/employment`
- `GET /api/demo/compare`
- `POST /api/compare`

## Demo flow

Open the landing page, select **Try the demo**, open the 30-day notice finding, switch to Obligations, ask what is required before leaving, then run the Compare demo and open Lawyer Prep.

## Privacy and limitations

The development API stores documents only in memory and does not log document contents, secrets, or API keys. Restarting the backend clears the workspace. Scanned PDFs without an embedded text layer need OCR before upload. The demo AI service is deterministic and local; the Gemini provider boundary is intentionally isolated for future production integration.

NyayLens never claims to be a lawyer and never declares that a document is valid, invalid, safe, unsafe, good, or bad. Discuss important decisions with a qualified legal professional.
