export type Finding = { id: string; title: string; category: string; section: string; page: number; original: string; simple: string; why: string; question: string };
export type Obligation = { text: string; party: string; deadline: string; source: string; status: string };
export type DocumentData = { id: string; filename: string; type: string; page_count: number; parties: string; effective_date: string; expiry_date: string; summary: string; clauses: Finding[]; obligations: Obligation[]; timeline: { date: string; event: string; detail: string; source: string; party?: string; section?: string; original?: string }[]; text?: string; preview?: string };
export type Answer = { answer: string; sources: string[]; confidence: string; limitations: string };
