# NyayLens Demo Video Script

All sample names, organizations, and agreements are fictional. Use the local demo for product demonstration only; it is not legal advice.

## Two-minute walkthrough

1. Start the backend and frontend using the root README setup steps, then open `http://localhost:5173`.
2. Select **Try the demo** and open the 30-day notice finding. Show the original clause, plain-language explanation, and source.
3. Open **Obligations**, then **Ask AI**. Ask: “What is the notice period?” Point out the quoted document evidence and limitation.
4. Open **Documents** and upload `samples/employment_agreement_v1.txt` and `samples/employment_agreement_v2.txt`.
5. Open **Compare**, select v1 as the original and v2 as the updated version, then compare. Show the payment, notice, and renewal text changes.
6. Upload `samples/residential_lease.txt` to show that the analysis reflects the selected document rather than a fixed employment report.

## Recording notes

- Keep both terminal windows running while recording. The API terminal serves port `8000`; Vite serves port `5173`.
- The backend stores documents in memory. Upload the samples after each backend restart.
- Local analysis uses simple text matching and sentence comparison. Present results as a demo, not as professional legal review.