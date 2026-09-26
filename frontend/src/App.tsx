import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Bell, BookOpen, Check, ChevronRight, Clock3, FileText, FolderOpen, GitCompareArrows, Info, LayoutDashboard, ListChecks, Menu, MessageSquare, Plus, Scale, Settings, ShieldCheck, Sparkles, UploadCloud, X } from 'lucide-react';
import type { Answer, DocumentData } from './types';
import CompareWorkspace from './CompareWorkspace';
import AuthPage from './AuthPage';
import { getCurrentUser, logOut, type AuthUser } from './auth';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, options);
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.detail || 'Something went wrong.'); }
  return response.json();
}

function App() {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) return;
    let active = true;
    api<DocumentData[]>("/api/documents")
      .then((items) => {
        if (active) setDocuments(items);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user]);
  const refresh = () =>
    api<DocumentData[]>("/api/documents")
      .then(setDocuments)
      .catch(() => undefined);
  const handleAuthentication = (authenticatedUser: AuthUser) => {
    setUser(authenticatedUser);
    navigate("/dashboard");
  };
  const handleLogout = () => {
    logOut();
    setUser(null);
    navigate("/");
  };
  if (!user) return <AuthPage onAuthenticated={handleAuthentication} />;
  return (
    <div className="app-shell">
      <aside id="workspace-sidebar" className={mobileMenu ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <span className="brand-mark">
            <Scale size={18} />
          </span>
          <span>
            nyay<span>lens</span>
          </span>
        </div>
        <button className="close-mobile" aria-label="Close navigation" onClick={() => setMobileMenu(false)}>
          <X />
        </button>
        <div className="workspace-label">WORKSPACE</div>
        <nav aria-label="Primary navigation">
          {[
            ["/dashboard", "Overview", LayoutDashboard],
            ["/documents", "Documents", FolderOpen],
            ["/compare", "Compare", GitCompareArrows],
            ["/ask", "Ask AI", MessageSquare],
            ["/action-plan", "Action plan", ListChecks],
            ["/lawyer-prep", "Lawyer prep", Scale],
          ].map(([to, label, Icon]) => (
            <NavLink
              key={String(to)}
              to={String(to)}
              onClick={() => setMobileMenu(false)}
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <Icon size={17} />
              <span>{String(label)}</span>
              {label === "Documents" && documents.length > 0 && (
                <small>{documents.length}</small>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/settings" className="nav-item">
            <Settings size={17} />
            <span>Settings</span>
          </NavLink>
          <div className="privacy">
            <ShieldCheck size={15} />
            <span>Your documents stay private</span>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" aria-label="Open navigation" aria-expanded={mobileMenu} aria-controls="workspace-sidebar" onClick={() => setMobileMenu(true)}>
            <Menu />
          </button>
          <div className="breadcrumb">
            Workspace <ChevronRight size={14} /> <span>NyayLens</span>
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <span className="profile-identity">
              <strong>{user.fullName}</strong>
              <small>{user.email}</small>
            </span>
            <div className="avatar">
              {user.fullName
                .split(/\s+/)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                documents={documents}
                onRefresh={refresh}
                user={user}
              />
            }
          />
          <Route
            path="/documents"
            element={<Documents documents={documents} onRefresh={refresh} />}
          />
          <Route path="/documents/:id" element={<DocumentWorkspace />} />
          <Route
            path="/compare"
            element={
              <CompareWorkspace documents={documents} onRefresh={refresh} />
            }
          />
          <Route
            path="/compare/demo"
            element={<Compare documents={documents} />}
          />
          <Route path="/ask" element={<AskPage documents={documents} />} />
          <Route path="/action-plan" element={<ActionPlan />} />
          <Route path="/lawyer-prep" element={<LawyerPrep />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="*"
            element={
              <Dashboard
                documents={documents}
                onRefresh={refresh}
                user={user}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function Landing() {
  const navigate = useNavigate();
  const start = async () => {
    const doc = await api<DocumentData>("/api/demo/employment");
    navigate(`/documents/${doc.id}`);
  };
  return (
    <div className="landing">
      <div className="landing-hero">
        <div className="eyebrow">
          <Sparkles size={14} /> DOCUMENT INTELLIGENCE, REFOCUSED
        </div>
        <h1>
          Understand the fine print.
          <br />
          <em>Before it becomes a problem.</em>
        </h1>
        <p>
          NyayLens turns complex legal documents into plain-language
          explanations, evidence-backed insights, and actionable next steps.
        </p>
        <div className="hero-actions">
          <button className="button primary" onClick={start}>
            Try the demo <ArrowRight size={16} />
          </button>
          <button
            className="button secondary"
            onClick={() => navigate("/documents")}
          >
            Upload a document
          </button>
        </div>
        <div className="disclaimer">
          <ShieldCheck size={15} /> NyayLens provides document-based
          information for educational purposes and does not replace advice from
          a qualified legal professional.
        </div>
      </div>
      <div className="landing-note">
        <span>01</span>
        <strong>Less legal fog.</strong>
        <span>More clarity for the decisions in front of you.</span>
      </div>
      <div className="feature-grid">
        {[
          [
            "Understand",
            "Translate dense clauses into language you can actually use.",
            BookOpen,
          ],
          [
            "Detect",
            "Surface obligations, deadlines, and areas worth reviewing.",
            AlertCircle,
          ],
          [
            "Compare",
            "See exactly what changed between two versions.",
            GitCompareArrows,
          ],
          [
            "Prepare",
            "Walk into a legal consultation with better questions.",
            MessageSquare,
          ],
        ].map(([title, copy, Icon]) => (
          <div className="feature" key={String(title)}>
            <Icon size={20} />
            <h3>{String(title)}</h3>
            <p>{String(copy)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow || "NYAYLENS"}</div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Dashboard({
  documents,
  onRefresh,
  user,
}: {
  documents: DocumentData[];
  onRefresh: () => void;
  user: AuthUser;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const navigate = useNavigate();
  const start = async () => {
    const d = await api<DocumentData>("/api/demo/employment");
    await onRefresh();
    navigate(`/documents/${d.id}`);
  };
  return (
    <div className="page">
      <PageHeader
        eyebrow={now.toLocaleString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
        title={`Good ${now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening"}, ${user.fullName.split(/\s+/)[0]}`}
        subtitle="Understand your documents and know what to review next."
        action={
          <button className="button primary" onClick={start}>
            <Plus size={16} /> Analyze document
          </button>
        }
      />
      <section className="quick-actions">
        <button onClick={() => navigate("/documents")}>
          <UploadCloud />
          <span>
            <strong>Upload document</strong>
            <small>PDF, DOCX or TXT</small>
          </span>
          <ArrowRight size={16} />
        </button>
        <button onClick={() => navigate("/compare")}>
          <GitCompareArrows />
          <span>
            <strong>Compare versions</strong>
            <small>Find factual changes</small>
          </span>
          <ArrowRight size={16} />
        </button>
        <button onClick={() => navigate("/ask")}>
          <MessageSquare />
          <span>
            <strong>Ask NyayLens</strong>
            <small>Get grounded answers</small>
          </span>
          <ArrowRight size={16} />
        </button>
      </section>
      <div className="section-heading">
        <h2>Attention overview</h2>
        <span>Across your workspace</span>
      </div>
      <div className="metric-grid">
        {[
          ["Important clauses", "06", "red"],
          ["Obligations", "08", "orange"],
          ["Deadlines", "03", "blue"],
          ["Items to review", "05", "yellow"],
        ].map(([label, value, tone]) => (
          <div className="metric" key={String(label)}>
            <span className={`metric-dot ${tone}`}></span>
            <small>{String(label)}</small>
            <strong>{String(value)}</strong>
          </div>
        ))}
      </div>
      <div className="section-heading">
        <h2>Recent documents</h2>
        <Link to="/documents">
          View all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="document-grid">
        {documents
          .filter(
            (d) =>
              d.id.startsWith("demo-") &&
              !d.id.includes("v1") &&
              !d.id.includes("v2"),
          )
          .slice(0, 3)
          .map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        {documents.length === 0 && (
          <div className="empty-state">
            <FileText />
            <p>Your document workspace is empty.</p>
            <button className="button secondary" onClick={start}>
              Load demo agreement
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentCard({doc}:{doc:DocumentData}) { return <Link to={`/documents/${doc.id}`} className="document-card"><div className="file-icon"><FileText size={20}/></div><div className="card-top"><span className="status-pill"><span></span>Analyzed</span><button aria-label="More options" onClick={(e)=>e.preventDefault()}>•••</button></div><h3>{doc.filename}</h3><p>{doc.type} <span>·</span> {doc.page_count} pages</p><div className="card-footer"><span><AlertCircle size={14}/> {doc.clauses.length} findings</span><span><Clock3 size={14}/> {doc.obligations.length} obligations</span></div></Link> }

function Documents({documents,onRefresh}:{documents:DocumentData[],onRefresh:()=>void}) { const navigate=useNavigate(); const [error,setError]=useState(''); const upload=async(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0]; if(!file)return; const form=new FormData(); form.append('file',file); try{const doc=await api<DocumentData>('/api/documents/upload',{method:'POST',body:form}); await onRefresh(); navigate(`/documents/${doc.id}`)}catch(err){setError(err instanceof Error?err.message:'Upload failed')}}; const demo=async(key:string)=>{const doc=await api<DocumentData>('/api/demo/employment'); await onRefresh(); navigate(`/documents/${doc.id}`)}; return <div className="page"><PageHeader eyebrow="DOCUMENTS" title="Your document workspace" subtitle="Upload, understand, and keep track of the fine print." action={<label className="button primary"><UploadCloud size={16}/> Upload document<input type="file" accept=".pdf,.docx,.txt" hidden onChange={upload}/></label>}/>{error&&<div className="error-banner"><AlertCircle size={16}/>{error}</div>}<div className="upload-zone"><div className="upload-symbol"><UploadCloud/></div><h2>Drop your legal document here</h2><p>PDF, DOCX or TXT · up to 15 MB</p><label className="button secondary">Browse files<input type="file" accept=".pdf,.docx,.txt" hidden onChange={upload}/></label><button className="text-button" onClick={()=>demo('employment')}>Try the Employment Agreement demo <ArrowRight size={14}/></button></div><div className="section-heading"><h2>All documents</h2><span>{documents.length} in workspace</span></div><div className="document-grid">{documents.map(doc=><DocumentCard key={doc.id} doc={doc}/>)}</div></div> }

function DocumentWorkspace() {
  const { id } = useParams();
  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [tab, setTab] = useState("Overview");
  const [selected, setSelected] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  useEffect(() => {
    if (id)
      api<DocumentData>(`/api/documents/${id}`)
        .then(setDoc)
        .catch(() => undefined);
  }, [id]);
  if (!doc) return <div className="loading">Loading document…</div>;
  const ask = async () => {
    if (!question) return;
    setAnswer(
      await api<Answer>(`/api/documents/${doc.id}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      }),
    );
  };
  return (
    <div className="page workspace">
      <div className="workspace-head">
        <div>
          <div className="eyebrow">DOCUMENT WORKSPACE</div>
          <h1>{doc.filename}</h1>
          <p>
            {doc.type} <span>·</span> {doc.page_count} pages <span>·</span>{" "}
            analyzed just now
          </p>
        </div>
        <button className="button secondary">
          <ShieldCheck size={15} /> Private workspace
        </button>
      </div>
      <div className="workspace-layout">
        <section className="viewer">
          <div className="viewer-toolbar">
            <span>
              <FileText size={15} /> {doc.filename}
            </span>
            <span>Page 1 / {doc.page_count}</span>
          </div>
          <div className="paper">
            <div className="paper-kicker">{doc.type.toUpperCase()}</div>
            <h2>{doc.filename.split(" · ")[0]}</h2>
            <p className="paper-muted">Original extracted document text</p>
            <div className="paper-rule"></div>
            <h3>Document preview</h3>
            <pre
              className="document-source"
              style={{
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                font: "inherit",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {doc.text ?? doc.preview}
            </pre>
          </div>
        </section>
        <section className="insights">
          <div className="tabs">
            {["Overview", "Important", "Obligations", "Timeline", "Ask AI"].map(
              (t) => (
                <button
                  className={tab === t ? "selected" : ""}
                  onClick={() => setTab(t)}
                  key={t}
                >
                  {t}
                </button>
              ),
            )}
          </div>
          {tab === "Overview" && <Overview doc={doc} onSelect={setSelected} />}{" "}
          {tab === "Important" && <Findings doc={doc} onSelect={setSelected} />}{" "}
          {tab === "Obligations" && <Obligations doc={doc} />}{" "}
          {tab === "Timeline" && <Timeline doc={doc} />}{" "}
          {tab === "Ask AI" && (
            <AskPanel
              question={question}
              setQuestion={setQuestion}
              answer={answer}
              ask={ask}
            />
          )}
        </section>
      </div>
      {selected && (
        <ClausePanel
          clause={doc.clauses.find((c) => c.id === selected)!}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Overview({
  doc,
  onSelect,
}: {
  doc: DocumentData;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <div className="insight-intro">
        <span className="status-pill">
          <span></span>Analysis complete
        </span>
        <h2>Here is what stood out.</h2>
        <p>
          NyayLens found {doc.clauses.length} areas to review,{" "}
          {doc.obligations.length} obligations, and {doc.timeline.length}{" "}
          time-bound items.
        </p>
      </div>
      <div className="overview-facts">
        <div>
          <small>PARTIES</small>
          <strong>{doc.parties}</strong>
        </div>
        <div>
          <small>EFFECTIVE DATE</small>
          <strong>{doc.effective_date}</strong>
        </div>
        <div>
          <small>EXPIRY DATE</small>
          <strong>{doc.expiry_date}</strong>
        </div>
      </div>
      <div className="summary-block">
        <div className="section-heading">
          <h3>Executive summary</h3>
          <span>Document-grounded</span>
        </div>
        <p>{doc.summary}</p>
      </div>
      <div className="finding-list">
        {doc.clauses.slice(0, 2).map((c) => (
          <FindingCard key={c.id} finding={c} onSelect={onSelect} />
        ))}
      </div>
    </>
  );
}
function Findings({doc,onSelect}:{doc:DocumentData,onSelect:(id:string)=>void}) { return <div className="finding-list full"><div className="insight-intro"><h2>Important clauses</h2><p>Priority labels describe what deserves attention in the document. They are not legal conclusions.</p></div>{doc.clauses.map(c=><FindingCard key={c.id} finding={c} onSelect={onSelect}/>)}</div> }
function FindingCard({finding,onSelect}:{finding:DocumentData['clauses'][number],onSelect:(id:string)=>void}) { return <article className="finding-card"><div className="finding-top"><span className={`priority ${finding.category.includes('High')?'high':finding.category.includes('Review')?'review':'important'}`}><span></span>{finding.category}</span><span>{finding.section} · Page {finding.page}</span></div><h3>{finding.title}</h3><p>{finding.simple}</p><div className="finding-actions"><button className="text-button" onClick={()=>onSelect(finding.id)}>Explain this clause <ArrowRight size={14}/></button><button className="source-button"><BookOpen size={13}/> View source</button></div></article> }
function Obligations({doc}:{doc:DocumentData}) { const [items,setItems]=useState(doc.obligations); return <div className="tab-content"><div className="insight-intro"><h2>Obligations</h2><p>Concrete actions identified in the document. Update these as you work through them.</p></div><div className="obligation-table"><div className="table-head"><span>OBLIGATION</span><span>RESPONSIBLE</span><span>DEADLINE</span><span>STATUS</span></div>{items.map((o,i)=><div className="table-row" key={i}><span><button className={`check ${o.status==='Completed'?'done':''}`} onClick={()=>setItems(items.map((x,j)=>j===i?{...x,status:x.status==='Completed'?'Pending':'Completed'}:x))}>{o.status==='Completed'&&<Check size={12}/>}</button>{o.text}</span><span>{o.party}</span><span>{o.deadline}</span><span className="select-status">{o.status}</span></div>)}</div></div> }
function Timeline({ doc }: { doc: DocumentData }) {
  return (
    <div className="tab-content">
      <div className="insight-intro">
        <h2>Legal timeline</h2>
        <p>Dates and time-bound requirements found in the document.</p>
      </div>
      <div className="timeline">
        {doc.timeline.map((item, i) => (
          <div className="timeline-item" key={i}>
            <div className="timeline-dot"></div>
            <div>
              <span>{item.date}</span>
              <h3>{item.event}</h3>
              {item.party && <p>Responsible: {item.party}</p>}
              <p>{item.detail}</p>
              {item.original && <blockquote>{item.original}</blockquote>}
              <small>{item.source}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function AskPanel({
  question,
  setQuestion,
  answer,
  ask,
}: {
  question: string;
  setQuestion: (s: string) => void;
  answer: Answer | null;
  ask: () => void;
}) {
  return (
    <div className="ask-panel">
      <div className="suggestions">
        {[
          "What do I need to do before leaving this job?",
          "What are the main payment terms?",
          "Which clauses should I discuss with a lawyer?",
        ].map((q) => (
          <button onClick={() => setQuestion(q)} key={q}>
            {q}
            <ArrowRight size={14} />
          </button>
        ))}
      </div>
      <div className="ask-box">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this document…"
        />
        <button className="button primary" onClick={ask}>
          Ask NyayLens <ArrowRight size={15} />
        </button>
      </div>
      {answer && (
        <div className="answer">
          <div className="answer-label">
            <Sparkles size={15} /> NYAYLENS ANSWER{" "}
            <span>{answer.confidence} confidence</span>
          </div>
          <p>{answer.answer}</p>
          <div className="answer-source">
            <small>EVIDENCE</small>
            {answer.sources.map((s) => (
              <span key={s}>
                <BookOpen size={13} />
                {s}
              </span>
            ))}
          </div>
          <div className="limitation">
            <Info size={14} />
            {answer.limitations}
          </div>
        </div>
      )}
    </div>
  );
}
function ClausePanel({clause,onClose}:{clause:DocumentData['clauses'][number],onClose:()=>void}) { return <div className="overlay"><aside className="clause-panel"><div className="panel-head"><div><div className="eyebrow">CLAUSE EXPLAINER</div><h2>{clause.title}</h2></div><button className="icon-button" onClick={onClose}><X/></button></div><div className="panel-body"><span className="priority high">{clause.section} · Page {clause.page}</span><div className="panel-section"><small>ORIGINAL TEXT</small><blockquote>“{clause.original}”</blockquote></div><div className="explain-arrow">↓</div><div className="panel-section"><small>IN PLAIN LANGUAGE</small><p className="large-copy">{clause.simple}</p></div><div className="panel-section"><small>WHY IT MATTERS</small><p>{clause.why}</p></div><div className="panel-section"><small>QUESTION TO CONSIDER</small><p>{clause.question}</p></div></div><div className="panel-footer"><BookOpen size={14}/> Source: {clause.section} · Page {clause.page}</div></aside></div> }

function Compare({documents}:{documents:DocumentData[]}) { const [result,setResult]=useState<any>(null); const load=async()=>{await api('/api/demo/compare'); const docs=await api<DocumentData[]>('/api/documents'); const a=docs.find(d=>d.id==='demo-employment-v1'); const b=docs.find(d=>d.id==='demo-employment-v2'); if(a&&b)setResult(await api('/api/compare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({document_a:a.id,document_b:b.id})}))}; return <div className="page"><PageHeader eyebrow="COMPARE" title="What changed?" subtitle="See factual differences between two document versions." action={<button className="button primary" onClick={load}><GitCompareArrows size={16}/> Run demo comparison</button>}/><div className="compare-selectors"><div><small>DOCUMENT A · ORIGINAL</small><strong>Employment Agreement · Contract v1</strong><span>Uploaded 12 Aug 2024</span></div><div className="compare-arrow"><GitCompareArrows/></div><div><small>DOCUMENT B · UPDATED</small><strong>Employment Agreement · Contract v2</strong><span>Uploaded 24 Sep 2024</span></div></div>{result?<div className="comparison-result"><div className="compare-summary"><div><span className="eyebrow">SUMMARY</span><h2>{result.summary}</h2></div><div className="change-counts"><span><b>{result.counts.added}</b> Added</span><span><b>{result.counts.modified}</b> Modified</span><span><b>{result.counts.removed}</b> Removed</span></div></div><div className="change-list">{result.changes.map((c:any)=><div className="change-card" key={c.title}><div className="change-card-head"><span className="priority review">{c.category}</span><span>{c.source}</span></div><h3>{c.title}</h3><div className="diff"><div><small>OLD</small><p>{c.old}</p></div><ArrowRight/><div className="new-value"><small>NEW</small><p>{c.new}</p></div></div><p>{c.detail}</p></div>)}</div><div className="questions-box"><Sparkles size={18}/><div><h3>Questions you may want to ask a legal professional</h3>{result.questions.map((q:string)=><p key={q}>· {q}</p>)}</div></div></div>:<div className="compare-empty"><GitCompareArrows size={28}/><h2>Compare two versions side by side</h2><p>Use the demo comparison to see how NyayLens surfaces changes in money, dates, responsibilities, and renewal terms.</p><button className="button secondary" onClick={load}>Try the comparison demo <ArrowRight size={15}/></button></div>}</div> }

function AskPage({documents}:{documents:DocumentData[]}) { const [selected,setSelected]=useState(documents[0]?.id || 'demo-employment'); const [question,setQuestion]=useState(''); const [answer,setAnswer]=useState<Answer|null>(null); useEffect(()=>{if(documents[0])setSelected(documents[0].id)},[documents]); const ask=async()=>setAnswer(await api<Answer>(`/api/documents/${selected}/ask`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question})})); return <div className="page narrow-page"><PageHeader eyebrow="ASK NYAYLENS" title="Questions, grounded in your documents." subtitle="Get clear answers with evidence you can trace back to the source."/><div className="document-picker"><label>Ask about</label><select value={selected} onChange={e=>setSelected(e.target.value)}>{documents.map(d=><option value={d.id} key={d.id}>{d.filename}</option>)}<option value="demo-employment">Employment Agreement · Demo</option></select></div><div className="ask-page-box"><textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="What would you like to understand?"/><button className="button primary" onClick={ask}><MessageSquare size={15}/> Ask question</button></div><div className="suggested-grid">{['What are my main responsibilities?','What deadlines do I need to know?','What happens if I terminate early?','Which clauses need careful review?'].map(q=><button key={q} onClick={()=>setQuestion(q)}>{q}<ArrowRight size={14}/></button>)}</div>{answer&&<div className="answer large-answer"><div className="answer-label"><Sparkles size={15}/> DOCUMENT-GROUNDED ANSWER <span>{answer.confidence} confidence</span></div><p>{answer.answer}</p><div className="answer-source"><small>SOURCES</small>{answer.sources.map(s=><span key={s}>{s}</span>)}</div><div className="limitation"><Info size={14}/>{answer.limitations}</div></div>}</div> }
function ActionPlan() { const [tasks,setTasks]=useState(['Review the termination clause','Confirm the notice deadline','Check the monthly payment obligation','Review the confidentiality requirement','Ask about work product ownership','Gather related correspondence','Write down missing information']); return <div className="page narrow-page"><PageHeader eyebrow="ACTION PLAN" title="Your action plan" subtitle="A practical list of items to review, based on the document."/><div className="progress-card"><div><span className="eyebrow">YOUR PROGRESS</span><strong>{tasks.filter(t=>t.startsWith('✓')).length} <small>/ {tasks.length} completed</small></strong></div><div className="progress-track"><span style={{width:`${tasks.filter(t=>t.startsWith('✓')).length/tasks.length*100}%`}}/></div></div><div className="task-list">{tasks.map((task,i)=><button className={task.startsWith('✓')?'task completed':'task'} onClick={()=>setTasks(tasks.map((x,j)=>j===i?(x.startsWith('✓')?x.slice(2):`✓ ${x}`):x))} key={i}><span className="task-check">{task.startsWith('✓')&&<Check size={13}/>}</span><span>{task.startsWith('✓')?task.slice(2):task}</span></button>)}</div><div className="disclaimer bottom-note"><ShieldCheck size={15}/> NyayLens helps organize information. It does not tell you which legal decision to make.</div></div> }
type PrepSection = { number: string; title: string; text: string };

function extractPrepSections(text: string): PrepSection[] {
  const lines = text.split(/\r?\n/);
  const headings = lines.flatMap((line, index) => {
    const match = /^\s*(?:section\s+(\d+(?:\.\d+)*)(?:[.):\-–—→]\s*)?(.+?)|(\d+(?:\.\d+)*)([.):\-–—→])\s*(.+?))\s*$/i.exec(line);
    if (!match) return [];
    const number = match[1] ?? match[3];
    const title = (match[2] ?? match[5]).replace(/^→\s*/, "").trim();
    if (!title || /^(January|February|March|April|May|June|July|August|September|October|November|December)\b/i.test(title)) return [];
    return [{ number, title, line: index }];
  });

  return headings.map((heading, index) => ({
    number: heading.number,
    title: heading.title,
    text: lines.slice(heading.line + 1, headings[index + 1]?.line ?? lines.length).join("\n").trim(),
  }));
}

function LawyerPrep() {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api<DocumentData[]>("/api/documents")
      .then((items) => {
        if (!active) return;
        setDocuments(items);
        if (items.length) setSelectedId(items[items.length - 1].id);
        else setLoading(false);
      })
      .catch((cause) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Could not load documents.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<DocumentData>(`/api/documents/${selectedId}`, { signal: controller.signal })
      .then((item) => setDocument(item))
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setDocument(null);
          setError(cause instanceof Error ? cause.message : "Could not load this document.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [selectedId]);

  const sections = extractPrepSections(document?.text ?? "");
  const findings = document?.clauses ?? [];
  const foundSummary = sections.length
    ? `The uploaded document contains ${sections.length} numbered sections: ${sections.map((section) => section.title).join(", ")}.`
    : findings.length
      ? `Document-derived findings: ${findings.map((finding) => finding.title).join(", ")}.`
      : "The uploaded document does not contain enough extracted section detail to prepare a grounded summary.";
  const questions = sections.length
    ? sections.map((section) => {
        const title = section.title.toLowerCase();
        if (/salary|compensation|pay/.test(title)) return "Does the agreement explain how the stated salary is paid?";
        if (/start\s*date|commencement|effective/.test(title)) return "Does the stated start date match the parties' understanding?";
        if (/notice|terminat/.test(title)) return "How and when must written notice be delivered?";
        if (/property|return/.test(title)) return "Is there a process for documenting returned company property?";
        if (/renew/.test(title)) return "What action and timing apply if a party does not want renewal?";
        if (/confidential/.test(title)) return "What information is covered, and how long does this duty continue?";
        return `What details about ${section.title} should be clarified?`;
      })
    : findings.map((finding) => finding.question).filter(Boolean);

  return (
    <div className="page narrow-page">
      <PageHeader
        eyebrow="LAWYER PREP"
        title="Prepare for a legal consultation"
        subtitle="Organize the important information before speaking with a legal professional."
        action={<button className="button primary"><Plus size={16} /> Add a note</button>}
      />
      {documents.length > 0 && (
        <div className="document-picker">
          <label htmlFor="lawyer-prep-document">Prepare from</label>
          <select id="lawyer-prep-document" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {documents.map((item) => <option value={item.id} key={item.id}>{item.filename}</option>)}
          </select>
        </div>
      )}
      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="loading">Loading document…</div>
      ) : document ? (
        <div className="prep-grid">
          <div className="prep-card">
            <span>01</span>
            <h3>What I found</h3>
            <p>{foundSummary}</p>
            {document.parties !== "Not specified" && <p>{document.parties}</p>}
            {document.effective_date !== "Not specified" && <p>Effective date: {document.effective_date}</p>}
          </div>
          <div className="prep-card">
            <span>02</span>
            <h3>Important clauses</h3>
            {sections.length ? sections.map((section) => (
              <p key={`${section.number}-${section.title}`}>
                <strong>Section {section.number} · {section.title}</strong>
                <br />{section.text || "No supporting text was extracted under this heading."}
              </p>
            )) : findings.length ? findings.map((finding) => (
              <p key={finding.id}><strong>{finding.title}</strong><br />{finding.original}</p>
            )) : <p>The document does not contain enough extracted clause detail to list important clauses.</p>}
          </div>
          <div className="prep-card">
            <span>03</span>
            <h3>Questions to ask</h3>
            {questions.length ? questions.map((question) => <p key={question}>{question}</p>) : <p>The document does not contain enough clause detail to suggest document-specific questions.</p>}
          </div>
          <div className="prep-card">
            <span>04</span>
            <h3>General documents to consider bringing</h3>
            <p>General preparation suggestions, not facts found in the agreement.</p>
            <p>A complete copy of this agreement</p>
            <p>Any signed amendments or related correspondence, if they exist</p>
            <p>Records relevant to questions you plan to discuss</p>
          </div>
          <div className="prep-card">
            <span>05</span>
            <h3>Details to confirm with your legal professional</h3>
            <p>General prompts, not findings from the agreement.</p>
            <p>Terms the agreement does not explain clearly</p>
            <p>Whether other documents supplement these terms</p>
            <p>How the written terms apply to your circumstances</p>
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <FileText />
          <p>Upload a document to prepare a grounded consultation summary.</p>
          <Link className="button secondary" to="/documents">Open documents</Link>
        </div>
      ) : null}
      <div className="disclaimer bottom-note"><ShieldCheck size={15} /> This tool helps organize information for a legal consultation. It does not provide legal advice.</div>
    </div>
  );
}
function SettingsPage(){const [message,setMessage]=useState('');const clear=async()=>{try{await api('/api/documents',{method:'DELETE'});setMessage('Workspace cleared.');}catch(error){setMessage(error instanceof Error?error.message:'Could not clear workspace.')}};return <div className="page narrow-page"><PageHeader eyebrow="SETTINGS" title="Workspace settings" subtitle="Control your local NyayLens experience."/><div className="settings-list"><div><div><h3>Demo mode</h3><p>Use fictional documents and deterministic analysis when no Gemini key is configured.</p></div><span className="toggle on"></span></div><div><div><h3>Privacy notice</h3><p>Documents are kept in the local development process and are not logged by the API.</p></div><Info size={18}/></div><div><div><h3>Clear workspace</h3><p>Remove local documents held by the development API.</p></div><button className="button secondary" onClick={clear}>Clear data</button></div>{message&&<p role="status">{message}</p>}</div></div>}

export default App;
