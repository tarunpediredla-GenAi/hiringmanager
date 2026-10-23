import React from 'react';
import { X, Copy, Check, MessageSquare, Volume2 } from 'lucide-react';
import { ChatMessage } from '../types/interview';

interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onPlayTurnAudio?: (text: string) => void;
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onPlayTurnAudio,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopyTranscript = () => {
    const text = messages
      .map((m) => `[${m.timestamp}] ${m.role === 'alex' ? 'Alex (Interviewer)' : 'Candidate'}:\n${m.text}\n`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Live Interview Transcript</h3>
              <p className="text-xs text-slate-400">{messages.length} conversational turns recorded</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTranscript}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Copy transcript to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m) => {
            const isAlex = m.role === 'alex';
            const isCorrection =
              m.isCorrection ||
              (isAlex &&
                /(actually|not quite right|not quite|misconception|remember that|keep in mind|you're partly right|partially correct|the correct answer)/i.test(
                  m.text
                ));
            return (
              <div
                key={m.id}
                className={`flex flex-col gap-1.5 p-4 rounded-xl border text-sm transition ${
                  isAlex
                    ? isCorrection
                      ? 'bg-amber-950/20 border-amber-500/40 text-slate-200'
                      : 'bg-slate-950/80 border-indigo-900/40 text-slate-200'
                    : 'bg-indigo-950/30 border-indigo-700/40 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isAlex
                          ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/60'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                      }`}
                    >
                      {isAlex ? 'Alex (Gemini AI)' : 'Candidate'}
                    </span>
                    {isCorrection && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        ✨ Gemini Correction
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 font-mono">{m.timestamp}</span>
                  </div>

                  {isAlex && onPlayTurnAudio && (
                    <button
                      onClick={() => onPlayTurnAudio(m.text)}
                      className="p-1 text-slate-400 hover:text-indigo-400 transition"
                      title="Play audio of this question"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <p className="leading-relaxed mt-1 text-slate-200 font-normal">{m.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
