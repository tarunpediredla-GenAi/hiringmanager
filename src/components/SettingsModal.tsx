import React from 'react';
import { X, Settings, Sliders, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceName: string;
  onChangeVoice: (voice: string) => void;
  autoSendSilenceMs: number;
  onChangeAutoSendSilenceMs: (ms: number) => void;
  selectedScenario: string;
  onSelectScenario: (scenario: string) => void;
  speechRate: number;
  onChangeSpeechRate: (rate: number) => void;
}

const SCENARIOS = [
  {
    id: 'gen-ai-system-design',
    title: 'Gen AI Senior SWE: System Design Deep Dive',
    description: 'Enterprise multi-tenant RAG, vector indexes, semantic caching, token economics, and low-latency serving.',
  },
  {
    id: 'gen-ai-agents',
    title: 'Gen AI Senior SWE: Agentic Systems & Tool Calling',
    description: 'Autonomous multi-agent loops, state management, tool execution, cyclic failure recovery, and guardrails.',
  },
  {
    id: 'gen-ai-inference-opt',
    title: 'Gen AI Senior SWE: Model Serving & Latency Optimization',
    description: 'Continuous batching, vLLM / TensorRT, speculative decoding, KV-cache paging, and GPU cluster scaling.',
  },
  {
    id: 'behavioral-leadership',
    title: 'Senior SWE Behavioral: Tech Leadership & Trade-offs',
    description: 'Resolving architecture deadlocks, critical production incident triage, and cross-functional influence.',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  voiceName,
  onChangeVoice,
  autoSendSilenceMs,
  onChangeAutoSendSilenceMs,
  selectedScenario,
  onSelectScenario,
  speechRate,
  onChangeSpeechRate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-base">Interview Session Settings</h2>
              <p className="text-xs text-slate-400">Customize Alex's voice and practice scenarios</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Practice Scenarios */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Practice Scenario
            </label>
            <div className="space-y-2.5">
              {SCENARIOS.map((scenario) => {
                const isSelected = selectedScenario === scenario.title;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => onSelectScenario(scenario.title)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <h4 className="font-semibold text-slate-200 text-xs md:text-sm">{scenario.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{scenario.description}</p>
                    </div>
                    {isSelected && (
                      <div className="flex h-5 w-5 rounded-full bg-indigo-500 items-center justify-center text-white shrink-0 mt-0.5">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alex's Voice Selection */}
          <div className="pt-4 border-t border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Alex's Speech Voice (Gemini TTS)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { name: 'Fenrir', desc: 'Authoritative / Senior' },
                { name: 'Puck', desc: 'Conversational / Warm' },
                { name: 'Zephyr', desc: 'Crisp / Direct' },
                { name: 'Kore', desc: 'Clear / Articulate' },
                { name: 'Charon', desc: 'Deep / Steady' },
              ].map((v) => (
                <button
                  key={v.name}
                  onClick={() => onChangeVoice(v.name)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    voiceName === v.name
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs">{v.name}</div>
                  <div className="text-[10px] text-slate-400">{v.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Alex's Speaking Pace (Slow & Clear) */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5" /> Speaking Pace (Normal English / Slow)
              </label>
              <span className="text-xs font-mono text-indigo-400">
                {speechRate <= 0.85 ? `${speechRate}x (Slow & Deliberate)` : speechRate <= 0.92 ? `${speechRate}x (Recommended Calm)` : `${speechRate}x (Standard)`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0.75}
                max={1.1}
                step={0.05}
                value={speechRate}
                onChange={(e) => onChangeSpeechRate(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0.75x Slower</span>
              <span className="text-indigo-400 font-semibold">0.88x (Calm & Clear)</span>
              <span>1.1x Faster</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Alex speaks in natural, everyday conversational English at a measured pace so technical questions are easy to absorb.
            </p>
          </div>

          {/* Auto-Send Silence Threshold */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5" /> Auto-Send Silence Delay
              </label>
              <span className="text-xs font-mono text-indigo-400">
                {autoSendSilenceMs === 0 ? 'Disabled (Manual)' : `${(autoSendSilenceMs / 1000).toFixed(1)}s silence`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={4000}
              step={200}
              value={autoSendSilenceMs}
              onChange={(e) => onChangeAutoSendSilenceMs(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              When enabled, your answer will automatically be submitted after this period of quiet.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
