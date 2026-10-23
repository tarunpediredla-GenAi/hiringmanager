import React, { useState } from 'react';
import {
  X,
  Lightbulb,
  HelpCircle,
  AlertTriangle,
  Calculator,
  Layers,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  ShieldAlert,
} from 'lucide-react';

interface TipsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectQuestion?: (questionText: string) => void;
}

type TabCategory = 'all' | 'clarifying' | 'cheatsheet' | 'pitfalls';

interface ClarifyingQuestion {
  category: string;
  question: string;
  whyItMatters: string;
}

const CLARIFYING_QUESTIONS: ClarifyingQuestion[] = [
  {
    category: 'React & Streaming UI',
    question: 'Are we streaming LLM tokens from Django to React using Server-Sent Events (SSE) or WebSockets, and what is our retry strategy for dropped streams?',
    whyItMatters: 'Dictates whether you use standard EventSource / fetch ReadableStream in React or bidirectional WebSocket state.',
  },
  {
    category: 'Django & Async Workloads',
    question: 'Should heavy document parsing and embedding generation be offloaded asynchronously to Celery workers with a Redis broker?',
    whyItMatters: 'Essential to prevent blocking Gunicorn synchronous worker threads on long-running LLM calls.',
  },
  {
    category: 'SQL Database & pgvector',
    question: 'Should we store document embeddings directly in PostgreSQL using pgvector alongside relational metadata, or use a separate vector DB?',
    whyItMatters: 'pgvector keeps transactional ACID consistency and metadata joins simple, while dedicated vector DBs scale to billions of vectors.',
  },
  {
    category: 'ORM Query Optimization',
    question: 'What are our anticipated read vs. write ratios, and should we enforce select_related/prefetch_related to eliminate N+1 SQL queries in Django?',
    whyItMatters: 'Demonstrates senior understanding of Django ORM query generation and database connection pooling.',
  },
  {
    category: 'Auth & State Security',
    question: 'How do we handle authentication between React and Django (JWT with HttpOnly refresh cookies vs. CSRF-protected session cookies)?',
    whyItMatters: 'Secures full-stack API communication against XSS and CSRF vulnerabilities.',
  },
  {
    category: 'Gen AI Latency SLAs',
    question: 'What is our P99 Time-to-First-Token (TTFT) budget, and what is our maximum document chunk context window?',
    whyItMatters: 'Guides chunking size (e.g. 512 tokens with 64 overlap), embedding dimensions, and prompt template optimizations.',
  },
];

const BACK_OF_ENVELOPE_DATA = [
  { metric: 'Django Gunicorn Workers', value: '(2 × CPU Cores) + 1 workers per instance' },
  { metric: 'PostgreSQL pgvector HNSW', value: '15–30ms search for 1M vectors with m=16, ef_search=64' },
  { metric: 'Django ORM Optimization', value: 'select_related() for 1:1/FK (SQL JOIN); prefetch_related() for M:M' },
  { metric: 'React SSE Streaming TTFT', value: '<250ms time-to-first-token via Django StreamingHttpResponse' },
  { metric: 'Redis Cache Latency', value: '<3ms lookup for cached user sessions & semantic prompt embeddings' },
  { metric: 'Celery Task Concurrency', value: 'Prefetch multiplier = 1 for long-running Gen AI embedding jobs' },
  { metric: '1M Tokens Equivalent', value: '~750,000 words (~3,000 PDF document pages)' },
];

const COMMON_PITFALLS = [
  {
    title: 'Blocking Django Workers with Synchronous LLM Calls',
    wrong: 'Calling openai.generate() or gemini.generateContent() synchronously inside a standard Django views.py function.',
    right: 'Offload long processing to Celery workers, or use Django 4/5 Async views (async def with StreamingHttpResponse) for token streaming.',
    advice: 'Synchronous API calls exhaust the Gunicorn worker pool and crash production throughput.',
  },
  {
    title: 'Django ORM N+1 Query Cascade',
    wrong: 'Looping through serialized documents and querying author/category per item in Django serializers.',
    right: 'Always use select_related() and prefetch_related() on QuerySets to fetch relational data in a single SQL query.',
    advice: 'Senior interviewers heavily inspect database query volume and SQL indexing efficiency.',
  },
  {
    title: 'React State Thrashing on Streamed Tokens',
    wrong: 'Triggering full-page re-renders on every single token streamed from the backend.',
    right: 'Use localized React state or useRef buffers with requestAnimationFrame / throttle to update the chat message smoothly.',
    advice: 'Guarantees smooth 60fps rendering even during high-velocity LLM token output.',
  },
  {
    title: 'Storing Large Binary Files (PDFs) in SQL Database',
    wrong: 'Saving raw uploaded document files as binary BLOBs inside PostgreSQL columns.',
    right: 'Store raw documents in object storage (S3/Cloud Storage) and store only metadata, URLs, and chunk vectors in PostgreSQL.',
    advice: 'Prevents database bloat and keeps SQL backup/restore times fast.',
  },
  {
    title: 'Ignoring Prompt Injection & SQL Injection Boundaries',
    wrong: 'Concatenating raw user input directly into SQL strings or raw LLM prompt templates.',
    right: 'Use Django ORM parameterized queries for SQL safety, and sandwich user queries between clear delimiter tags with system guardrails.',
    advice: 'Demonstrates end-to-end full-stack defensive engineering.',
  },
];

export const TipsSidebar: React.FC<TipsSidebarProps> = ({
  isOpen,
  onClose,
  onInjectQuestion,
}) => {
  const [activeTab, setActiveTab] = useState<TabCategory>('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-sm md:text-base">System Design Playbook</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/60 font-mono">
                  FAANG Prep
                </span>
              </div>
              <p className="text-xs text-slate-400">Tactical guidance, clarifying questions & common traps</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 px-6 py-3 border-b border-slate-800 bg-slate-950/40 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Playbook' },
            { id: 'clarifying', label: 'Clarifying Questions' },
            { id: 'cheatsheet', label: 'Sizing & SLAs' },
            { id: 'pitfalls', label: 'Pitfalls to Avoid' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabCategory)}
              className={`px-3 py-1.5 rounded-xl font-medium transition shrink-0 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section: 4-Step Senior System Design Framework */}
          {(activeTab === 'all' || activeTab === 'clarifying') && (
            <div className="bg-gradient-to-br from-indigo-950/40 to-slate-950/60 border border-indigo-500/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-indigo-400" />
                <h4 className="font-semibold text-slate-100 text-xs uppercase tracking-wider font-mono">
                  The 4-Step Staff SWE Formula
                </h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                  <span className="font-bold text-indigo-400 block mb-0.5">1. Scope (5m)</span>
                  Functional goals, peak QPS, latency SLAs.
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                  <span className="font-bold text-indigo-400 block mb-0.5">2. High-Level (10m)</span>
                  Data flow, ingestion, vector store, serving.
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                  <span className="font-bold text-indigo-400 block mb-0.5">3. Deep Dive (15m)</span>
                  Chunking, caching, rerankers, vLLM batching.
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                  <span className="font-bold text-indigo-400 block mb-0.5">4. Resilience (5m)</span>
                  Circuit breakers, fallback BM25, guardrails.
                </div>
              </div>
            </div>
          )}

          {/* Section: Clarifying Questions */}
          {(activeTab === 'all' || activeTab === 'clarifying') && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-emerald-400" />
                  <h4 className="font-semibold text-slate-200 text-sm">
                    Golden Clarifying Questions to Ask Alex
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Click to ask Alex</span>
              </div>

              <div className="space-y-3">
                {CLARIFYING_QUESTIONS.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 transition group flex flex-col justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-indigo-300 font-mono">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-slate-100 font-medium leading-relaxed">
                        "{item.question}"
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal italic">
                        💡 Why: {item.whyItMatters}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => handleCopy(item.question, idx)}
                        className="px-2.5 py-1 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-850 border border-slate-800 transition flex items-center gap-1"
                        title="Copy to clipboard"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {onInjectQuestion && (
                        <button
                          onClick={() => {
                            onInjectQuestion(item.question);
                            onClose();
                          }}
                          className="px-3 py-1 rounded-lg text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition flex items-center gap-1 shadow-sm"
                        >
                          <span>Ask Alex Now</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Sizing & SLA Cheat Sheet */}
          {(activeTab === 'all' || activeTab === 'cheatsheet') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-4 w-4 text-indigo-400" />
                <h4 className="font-semibold text-slate-200 text-sm">
                  Back-of-the-Envelope & Gen AI SLA Cheat Sheet
                </h4>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80">
                {BACK_OF_ENVELOPE_DATA.map((row, i) => (
                  <div key={i} className="flex items-center justify-between p-3 text-xs">
                    <span className="font-semibold text-slate-300 font-mono">{row.metric}</span>
                    <span className="text-slate-400 text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Common Pitfalls & Traps to Avoid */}
          {(activeTab === 'all' || activeTab === 'pitfalls') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <h4 className="font-semibold text-slate-200 text-sm">
                  Common Fatal Pitfalls & How to Avoid Them
                </h4>
              </div>

              <div className="space-y-3">
                {COMMON_PITFALLS.map((pitfall, i) => (
                  <div key={i} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                      <h5 className="font-bold text-slate-200 text-xs md:text-sm">{pitfall.title}</h5>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-2.5 text-rose-200 leading-relaxed">
                        <span className="font-bold text-rose-400 block mb-0.5">❌ Pitfall:</span>
                        {pitfall.wrong}
                      </div>

                      <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-2.5 text-emerald-200 leading-relaxed">
                        <span className="font-bold text-emerald-400 block mb-0.5">✅ Senior Way:</span>
                        {pitfall.right}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 italic pt-1">
                      💡 Takeaway: {pitfall.advice}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
