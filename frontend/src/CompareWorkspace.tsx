import { useState } from 'react';
import { ArrowRight, GitCompareArrows, Link as LinkIcon, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DocumentData } from './types';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

type Comparison = {
  summary: string;
  counts: { added: number; removed: number; modified: number };
  changes: { title: string; old: string; new: string; type: string; category: string; source: string; detail: string }[];
  questions: string[];
};

export default function CompareWorkspace({ documents, onRefresh }: { documents: DocumentData[]; onRefresh: () => Promise<void> }) {
  const [firstId, setFirstId] = useState('');
  const [secondId, setSecondId] = useState('');
  const [result, setResult] = useState<Comparison | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const compare = async (documentA: string, documentB: string) => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_a: documentA, document_b: documentB }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || 'Comparison failed.');
      setResult(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Comparison failed.');
    } finally {
      setLoading(false);
    }
  };

  const runDemo = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/demo/compare`);
      if (!response.ok) throw new Error('Could not load the demo comparison.');
      const pair = await response.json() as { a: string; b: string };
      await onRefresh();
      setFirstId(pair.a);
      setSecondId(pair.b);
      await compare(pair.a, pair.b);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load the demo comparison.');
      setLoading(false);
    }
  };

  return <div className="page">
    <div className="page-header"><div><div className="eyebrow">COMPARE</div><h1>What changed?</h1><p>Compare two documents in your workspace. Differences are text-based and should be reviewed in context.</p></div><div className="hero-actions"><button className="button secondary" onClick={runDemo} disabled={loading}><Sparkles size={16}/> Run sample comparison</button><Link className="button secondary" to="/compare/demo"><LinkIcon size={15}/> Guided demo</Link></div></div>
    <div className="compare-selectors">
      <label><small>DOCUMENT A · ORIGINAL</small><select value={firstId} onChange={event => setFirstId(event.target.value)}><option value="">Choose a document</option>{documents.map(doc => <option value={doc.id} key={doc.id}>{doc.filename}</option>)}</select></label>
      <div className="compare-arrow"><GitCompareArrows/></div>
      <label><small>DOCUMENT B · UPDATED</small><select value={secondId} onChange={event => setSecondId(event.target.value)}><option value="">Choose a document</option>{documents.map(doc => <option value={doc.id} key={doc.id}>{doc.filename}</option>)}</select></label>
    </div>
    <button className="button primary" disabled={loading || !firstId || !secondId || firstId === secondId} onClick={() => compare(firstId, secondId)}><GitCompareArrows size={16}/>{loading ? 'Comparing…' : 'Compare selected documents'}</button>
    {error && <div className="error-banner">{error}</div>}
    {result && <div className="comparison-result"><div className="compare-summary"><div><span className="eyebrow">SUMMARY</span><h2>{result.summary}</h2></div><div className="change-counts"><span><b>{result.counts.added}</b> Added</span><span><b>{result.counts.modified}</b> Modified</span><span><b>{result.counts.removed}</b> Removed</span></div></div>
      {result.changes.length ? <div className="change-list">{result.changes.map((change, index) => <article className="change-card" key={`${change.title}-${index}`}><div className="change-card-head"><span className="priority review">{change.category}</span><span>{change.source}</span></div><h3>{change.type}: {change.title}</h3><div className="diff"><div><small>OLD</small><p>{change.old}</p></div><ArrowRight/><div className="new-value"><small>NEW</small><p>{change.new}</p></div></div><p>{change.detail}</p></article>)}</div> : <p>No text differences were found between these documents.</p>}
      <div className="questions-box"><Sparkles size={18}/><div><h3>Questions to review</h3>{result.questions.map(question => <p key={question}>· {question}</p>)}</div></div>
    </div>}
  </div>;
}