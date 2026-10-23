import React, { useState } from 'react';
import {
  Code,
  Database,
  Play,
  Copy,
  Check,
  Terminal,
  FileCode,
  Layers,
  Sparkles,
  Server,
  Cpu,
  RefreshCw,
} from 'lucide-react';

interface FullStackPlaygroundProps {
  onCodeChange?: (fullStackCodeSummary: string) => void;
}

// Preset Code Snippets
const REACT_SNIPPET = `// src/components/ChatStream.jsx - React 19 + HTML/CSS/JS + Tailwind CSS
import React, { useState, useRef } from 'react';

export function DocumentChat() {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;

    // 1. Add user message & empty assistant placeholder in React state
    const userMsg = { role: 'user', text: prompt };
    setMessages((prev) => [...prev, userMsg, { role: 'assistant', text: '' }]);
    const currentPrompt = prompt;
    setPrompt('');
    setIsStreaming(true);

    try {
      // 2. Fetch Server-Sent Events (SSE) stream from Django REST backend
      const response = await fetch('/api/v1/chat/stream/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt, document_id: 42 })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // 3. Stream chunks smoothly without full-page re-renders
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);

        setMessages((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          next[lastIdx] = {
            ...next[lastIdx],
            text: next[lastIdx].text + chunk
          };
          return next;
        });
      }
    } catch (err) {
      console.error('Streaming error:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-80 bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span className="inline-block px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs">
              {m.text}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 pt-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a question about the uploaded document..."
          className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
        />
        <button type="submit" className="px-3 py-1.5 bg-indigo-500 rounded-lg text-white font-bold text-xs">
          Send
        </button>
      </form>
    </div>
  );
}`;

const DJANGO_SNIPPET = `# backend/api/views.py - Python 3.12 + Django REST Framework + Google Gen AI
import json
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from google import genai
from .models import Document, DocumentChunk
from .tasks import process_pdf_document_task

client = genai.Client()

class DocumentChatStreamView(APIView):
    """
    Django REST endpoint:
    1. Embeds user prompt with Gemini text-embedding-004.
    2. Runs PostgreSQL SQL query using pgvector for cosine similarity.
    3. Streams response tokens directly to React via StreamingHttpResponse.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_prompt = request.data.get('prompt')
        document_id = request.data.get('document_id', 42)

        # Step 1: Generate 768-dim embedding for user prompt
        emb_res = client.models.embed_content(
            model='text-embedding-004',
            contents=user_prompt
        )
        query_vector = emb_res.embedding.values

        # Step 2: Query PostgreSQL using pgvector cosine distance (<=> operator)
        # Using select_related('document') to prevent N+1 SQL queries!
        relevant_chunks = (
            DocumentChunk.objects.filter(document_id=document_id)
            .select_related('document')
            .order_by_cosine_distance('embedding', query_vector)[:3]
        )
        context = "\\n\\n".join([c.chunk_text for c in relevant_chunks])

        # Step 3: Stream tokens from Gemini LLM
        def stream_tokens():
            sys_prompt = "You are a helpful assistant. Use only the provided document context to answer."
            full_prompt = f"Context:\\n{context}\\n\\nQuestion: {user_prompt}"

            response = client.models.generate_content_stream(
                model='gemini-2.5-flash',
                contents=full_prompt,
                config={'system_instruction': sys_prompt}
            )
            for chunk in response:
                if chunk.text:
                    yield chunk.text

        return StreamingHttpResponse(stream_tokens(), content_type='text/event-stream')

# backend/api/tasks.py - Celery Task for Async PDF Ingestion
from celery import shared_task
from .models import Document, DocumentChunk

@shared_task
def process_pdf_document_task(document_id):
    """Asynchronously parses PDF, creates 512-token chunks, and computes embeddings."""
    doc = Document.objects.select_related('user').get(id=document_id)
    # Background processing with Redis broker avoids blocking Gunicorn web workers
    return f"Indexed document {doc.title} with 24 chunks"`;

const SQL_PRESETS = [
  {
    name: 'Vector Cosine Search (pgvector)',
    query: `SELECT 
    d.title AS document_title,
    c.chunk_index,
    c.chunk_text,
    ROUND((1 - (c.embedding <=> '[0.018, -0.042, 0.081, ...]'))::numeric, 4) AS cosine_similarity
FROM document_chunks c
JOIN documents d ON d.id = c.document_id
WHERE c.document_id = 42
ORDER BY c.embedding <=> '[0.018, -0.042, 0.081, ...]'
LIMIT 3;`,
    columns: ['document_title', 'chunk_index', 'chunk_text', 'cosine_similarity'],
    rows: [
      ['Django_Architecture_Spec.pdf', 1, 'Django uses Gunicorn WSGI workers. Background tasks are offloaded to Celery...', 0.9421],
      ['Django_Architecture_Spec.pdf', 3, 'PostgreSQL pgvector extension stores 768-dim embeddings with HNSW indexing...', 0.9184],
      ['Django_Architecture_Spec.pdf', 2, 'React frontend connects to Django via Server-Sent Events for streaming...', 0.8872],
    ],
    executionTimeMs: 14,
  },
  {
    name: 'Relational Aggregation (N+1 Query Prevention)',
    query: `SELECT 
    u.email AS user_email,
    d.id AS document_id,
    d.title AS document_name,
    COUNT(c.id) AS total_chunks,
    MAX(c.created_at) AS last_indexed
FROM users u
JOIN documents d ON d.user_id = u.id
LEFT JOIN document_chunks c ON c.document_id = d.id
WHERE u.id = 1
GROUP BY u.email, d.id, d.title
ORDER BY total_chunks DESC;`,
    columns: ['user_email', 'document_id', 'document_name', 'total_chunks', 'last_indexed'],
    rows: [
      ['candidate@example.com', 42, 'Django_Architecture_Spec.pdf', 24, '2026-10-22 14:30:12'],
      ['candidate@example.com', 19, 'React_Streaming_Hooks.pdf', 12, '2026-10-21 09:15:45'],
      ['candidate@example.com', 8, 'PostgreSQL_Query_Optimization.pdf', 18, '2026-10-20 18:40:00'],
    ],
    executionTimeMs: 9,
  },
  {
    name: 'DDL: Tables & HNSW Index Definition',
    query: `CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE document_chunks (
    id SERIAL PRIMARY KEY,
    document_id INT REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(768) NOT NULL
);

-- HNSW Vector Index for sub-20ms similarity search
CREATE INDEX idx_chunks_hnsw ON document_chunks 
USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);`,
    columns: ['operation', 'target_table', 'status', 'latency_impact'],
    rows: [
      ['CREATE EXTENSION', 'vector', 'EXTENSION ENABLED', 'Enables 768-dim vector math'],
      ['CREATE TABLE', 'documents', 'TABLE CREATED', 'Relational document metadata'],
      ['CREATE TABLE', 'document_chunks', 'TABLE CREATED', 'Stores text chunks & embeddings'],
      ['CREATE INDEX', 'idx_chunks_hnsw', 'INDEX BUILT', 'HNSW M=16, ef=64 for sub-20ms search'],
    ],
    executionTimeMs: 22,
  },
];

export const FullStackPlayground: React.FC<FullStackPlaygroundProps> = ({ onCodeChange }) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'react' | 'django' | 'sql'>('react');
  const [reactCode, setReactCode] = useState(REACT_SNIPPET);
  const [djangoCode, setDjangoCode] = useState(DJANGO_SNIPPET);
  const [selectedSqlPreset, setSelectedSqlPreset] = useState(0);
  const [sqlQuery, setSqlQuery] = useState(SQL_PRESETS[0].query);
  const [sqlResults, setSqlResults] = useState(SQL_PRESETS[0]);
  const [isRunningSql, setIsRunningSql] = useState(false);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const handleCopy = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleSelectSqlPreset = (idx: number) => {
    setSelectedSqlPreset(idx);
    setSqlQuery(SQL_PRESETS[idx].query);
    setSqlResults(SQL_PRESETS[idx]);
  };

  const handleRunSql = () => {
    setIsRunningSql(true);
    setTimeout(() => {
      setIsRunningSql(false);
      setSqlResults(SQL_PRESETS[selectedSqlPreset]);
    }, 280);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Tab Switcher Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveCodeTab('react')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeCodeTab === 'react'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileCode className="h-3.5 w-3.5 text-sky-400" />
            <span>React & HTML/CSS</span>
          </button>

          <button
            onClick={() => setActiveCodeTab('django')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeCodeTab === 'django'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Server className="h-3.5 w-3.5 text-emerald-400" />
            <span>Django & Python</span>
          </button>

          <button
            onClick={() => setActiveCodeTab('sql')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeCodeTab === 'sql'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Database className="h-3.5 w-3.5 text-amber-400" />
            <span>Interactive SQL & pgvector</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeCodeTab === 'sql' ? (
            <button
              onClick={handleRunSql}
              disabled={isRunningSql}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-slate-950" />
              <span>{isRunningSql ? 'Running...' : 'Run SQL Query'}</span>
            </button>
          ) : (
            <button
              onClick={() =>
                handleCopy(activeCodeTab === 'react' ? reactCode : djangoCode, activeCodeTab)
              }
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-850 border border-slate-800 transition"
              title="Copy code snippet"
            >
              {copiedTab === activeCodeTab ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Editor & Viewer Body */}
      <div className="flex-1 overflow-hidden flex flex-col p-3">
        {activeCodeTab === 'react' && (
          <div className="flex-1 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="font-mono text-sky-400 font-semibold">React 19 + HTML5 / CSS3 / JavaScript</span>
              <span>Streaming token buffer & optimistic UI updates</span>
            </div>
            <textarea
              value={reactCode}
              onChange={(e) => {
                setReactCode(e.target.value);
                if (onCodeChange) onCodeChange(e.target.value);
              }}
              className="flex-1 w-full bg-slate-950 font-mono text-xs text-slate-200 p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500/60 leading-relaxed resize-none shadow-inner"
              spellCheck={false}
            />
          </div>
        )}

        {activeCodeTab === 'django' && (
          <div className="flex-1 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="font-mono text-emerald-400 font-semibold">Python 3.12 + Django REST Framework + Celery</span>
              <span>Async StreamingHttpResponse & pgvector cosine query</span>
            </div>
            <textarea
              value={djangoCode}
              onChange={(e) => {
                setDjangoCode(e.target.value);
                if (onCodeChange) onCodeChange(e.target.value);
              }}
              className="flex-1 w-full bg-slate-950 font-mono text-xs text-slate-200 p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500/60 leading-relaxed resize-none shadow-inner"
              spellCheck={false}
            />
          </div>
        )}

        {activeCodeTab === 'sql' && (
          <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
            {/* SQL Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-500 font-semibold uppercase tracking-wider shrink-0 mr-1">
                Presets:
              </span>
              {SQL_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSqlPreset(idx)}
                  className={`px-2.5 py-1 rounded-lg shrink-0 transition ${
                    selectedSqlPreset === idx
                      ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50 font-semibold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* SQL Query Editor */}
            <div className="h-36">
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="w-full h-full bg-slate-950 font-mono text-xs text-amber-200/90 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500/60 leading-relaxed resize-none shadow-inner"
                spellCheck={false}
              />
            </div>

            {/* SQL Result Output Table */}
            <div className="flex-1 flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden min-h-[140px]">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Terminal className="h-3 w-3 text-amber-400" />
                  PostgreSQL Output ({sqlResults.rows.length} rows returned)
                </span>
                <span className="text-emerald-400 font-semibold">
                  ⚡ {sqlResults.executionTimeMs} ms
                </span>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                      {sqlResults.columns.map((col, idx) => (
                        <th key={idx} className="px-3 py-1.5 font-semibold text-[11px]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {sqlResults.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-900/40 text-slate-300">
                        {row.map((val, cIdx) => (
                          <td key={cIdx} className="px-3 py-1.5 truncate max-w-[200px]">
                            {typeof val === 'number' ? (
                              <span className="text-emerald-400 font-bold">{val}</span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
