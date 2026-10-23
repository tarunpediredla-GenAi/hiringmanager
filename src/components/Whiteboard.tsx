import React, { useState } from 'react';
import { Plus, Trash2, Share2, Layers, Cpu, Database, ShieldCheck, CheckCircle2, Code } from 'lucide-react';
import { WhiteboardNode } from '../types/interview';
import { FullStackPlayground } from './FullStackPlayground';

interface WhiteboardProps {
  nodes: WhiteboardNode[];
  onAddNode: (node: Omit<WhiteboardNode, 'id'>) => void;
  onRemoveNode: (id: string) => void;
  onUpdateNodeDescription: (id: string, description: string) => void;
  architectureNotes: string;
  onChangeNotes: (notes: string) => void;
  onShareWithAlex: () => void;
  isSharing: boolean;
  sharedSuccess: boolean;
  onCodeChange?: (code: string) => void;
}

const PRESET_COMPONENTS = [
  {
    label: 'React 19 SPA (HTML/CSS/JS)',
    category: 'compute' as const,
    description: 'React frontend with Tailwind CSS, custom hooks, and Server-Sent Events (SSE) streaming chat state.',
  },
  {
    label: 'Django REST Framework (DRF)',
    category: 'compute' as const,
    description: 'Python API endpoints with JWT auth, serializers, throttling, and Django AsyncStreamingHttpResponse.',
  },
  {
    label: 'Celery Worker & Redis Broker',
    category: 'ingestion' as const,
    description: 'Async task queue for non-blocking document ingestion, text chunking, and batch embedding calls.',
  },
  {
    label: 'PostgreSQL Database (SQL + pgvector)',
    category: 'storage' as const,
    description: 'Relational schema with normalized tables, foreign keys, and pgvector HNSW index for vector cosine similarity.',
  },
  {
    label: 'Redis Cache & Session Store',
    category: 'cache' as const,
    description: 'In-memory semantic cache (<5ms) for frequent queries, user session storage, and Celery task backend.',
  },
  {
    label: 'Gemini LLM & Embeddings API',
    category: 'compute' as const,
    description: 'Embeddings generation, dynamic prompt engineering with system instructions, and real-time token streaming.',
  },
  {
    label: 'Hybrid Search (SQL Full-Text + pgvector)',
    category: 'compute' as const,
    description: 'Combines PostgreSQL tsvector BM25 keyword matching with dense embedding similarity using Reciprocal Rank Fusion.',
  },
  {
    label: 'Guardrails & SQL Injection Filter',
    category: 'eval' as const,
    description: 'Django ORM parameterized query protection, prompt jailbreak filters, and PII masking.',
  },
  {
    label: 'Observability (Django Silk & Langfuse)',
    category: 'eval' as const,
    description: 'Profiles SQL query execution count (detects N+1 queries), Celery queue lag, and LLM token latency.',
  },
];

export const Whiteboard: React.FC<WhiteboardProps> = ({
  nodes,
  onAddNode,
  onRemoveNode,
  onUpdateNodeDescription,
  architectureNotes,
  onChangeNotes,
  onShareWithAlex,
  isSharing,
  sharedSuccess,
  onCodeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'components' | 'code' | 'notes'>('components');
  const [customLabel, setCustomLabel] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customCategory, setCustomCategory] = useState<'compute' | 'storage' | 'cache' | 'ingestion' | 'eval'>('compute');

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLabel.trim()) return;
    onAddNode({
      label: customLabel.trim(),
      description: customDesc.trim() || 'Custom component added by candidate.',
      category: customCategory,
      x: 0,
      y: 0,
    });
    setCustomLabel('');
    setCustomDesc('');
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'storage':
        return <span className="bg-sky-950/80 text-sky-300 border border-sky-800 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><Database className="h-2.5 w-2.5" /> Storage</span>;
      case 'cache':
        return <span className="bg-amber-950/80 text-amber-300 border border-amber-800 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><Cpu className="h-2.5 w-2.5" /> Cache</span>;
      case 'ingestion':
        return <span className="bg-purple-950/80 text-purple-300 border border-purple-800 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><Layers className="h-2.5 w-2.5" /> Ingestion</span>;
      case 'eval':
        return <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><ShieldCheck className="h-2.5 w-2.5" /> Eval / Guard</span>;
      default:
        return <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-800 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><Cpu className="h-2.5 w-2.5" /> Compute</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-400" />
          <h3 className="font-semibold text-slate-100 text-sm">Full Stack Architecture & Code Studio</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('components')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                activeTab === 'components'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Architecture ({nodes.length})
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition font-medium ${
                activeTab === 'code'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="h-3.5 w-3.5 text-emerald-400" />
              <span>Full Stack Code & SQL</span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                activeTab === 'notes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Specs & Notes
            </button>
          </div>

          {/* Share with Alex Button */}
          <button
            onClick={onShareWithAlex}
            disabled={isSharing || (nodes.length === 0 && !architectureNotes.trim())}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-md ${
              sharedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white'
            }`}
            title="Alex will evaluate your whiteboard choices and code in his next drill-down question"
          >
            {sharedSuccess ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Shared with Alex!
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                {isSharing ? 'Syncing...' : 'Share with Alex'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'code' ? (
          <FullStackPlayground onCodeChange={onCodeChange} />
        ) : activeTab === 'components' ? (
          <div>
            {/* Quick Add Presets Bar */}
            <div className="mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                Quick-Add Gen AI Architecture Blocks:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_COMPONENTS.map((preset, idx) => {
                  const alreadyAdded = nodes.some((n) => n.label === preset.label);
                  return (
                    <button
                      key={idx}
                      onClick={() =>
                        onAddNode({
                          label: preset.label,
                          category: preset.category,
                          description: preset.description,
                          x: 0,
                          y: 0,
                        })
                      }
                      disabled={alreadyAdded}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition ${
                        alreadyAdded
                          ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                          : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700/80 text-slate-200 hover:border-indigo-500'
                      }`}
                    >
                      <Plus className="h-3 w-3 text-indigo-400" />
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Candidate's Selected Architecture Components */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Your Architecture Diagram ({nodes.length} Components):
                </span>
                <span className="text-[11px] text-slate-500">
                  Edit component specs below to show senior-level technical depth
                </span>
              </div>

              {nodes.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                  <Cpu className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No components added yet.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Click the preset blocks above or add custom services to illustrate your design to Alex.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {nodes.map((node) => (
                    <div
                      key={node.id}
                      className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-slate-200 text-xs md:text-sm">{node.label}</h4>
                          <div className="flex items-center gap-1.5">
                            {getCategoryBadge(node.category)}
                            <button
                              onClick={() => onRemoveNode(node.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                              title="Remove component"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <textarea
                          value={node.description || ''}
                          onChange={(e) => onUpdateNodeDescription(node.id, e.target.value)}
                          placeholder="Add trade-offs, algorithms, sizing or SLAs..."
                          rows={2}
                          className="w-full bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Custom Component Form */}
            <form onSubmit={handleAddCustom} className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Custom component name (e.g. Speculative Decoder Worker)"
                className="flex-1 min-w-[200px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="compute">Compute</option>
                <option value="storage">Storage</option>
                <option value="cache">Cache</option>
                <option value="ingestion">Ingestion</option>
                <option value="eval">Eval/Guard</option>
              </select>
              <button
                type="submit"
                disabled={!customLabel.trim()}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Component
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                System Design Notes & Calculations:
              </span>
              <span className="text-[11px] text-slate-500">
                Formulate math, QPS, token sizing, and edge cases here
              </span>
            </div>

            <textarea
              value={architectureNotes}
              onChange={(e) => onChangeNotes(e.target.value)}
              placeholder="e.g. 
- QPS & Latency: 2,500 queries/sec peak. Target P99: 180ms total (TTFT: 75ms).
- Embeddings: 1536-dim vectors. 10M docs = ~60GB uncompressed RAM for HNSW graph.
- Cache Strategy: 35% cache hit rate via Redis semantic vector cache.
- Reranking: Cross-Encoder over top 40 candidates; prune context window to 3,000 tokens to save LLM compute.
- Failure Modes: Fallback to lexical BM25 search if vector service degrades."
              rows={12}
              className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs md:text-sm text-slate-200 font-mono leading-relaxed placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-inner"
            />
          </div>
        )}
      </div>
    </div>
  );
};
