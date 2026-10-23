import React from 'react';
import { X, Award, Trash2, ArrowUpRight, Clock, Layers, MessageSquare, Loader2 } from 'lucide-react';
import { SavedSessionSummary } from '../firebase/firebaseService';

interface SavedSessionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedSessionSummary[];
  isLoading: boolean;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const SavedSessionsDrawer: React.FC<SavedSessionsDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  isLoading,
  onSelectSession,
  onDeleteSession,
}) => {
  if (!isOpen) return null;

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'Strong Hire':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Hire':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'Lean Hire':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Lean No Hire':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <Award className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Saved Mock Interviews (Firebase)</h3>
              <p className="text-xs text-slate-400">{sessions.length} interview records stored in Firestore</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-xs text-slate-400">Loading interview archives from Firestore...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40 p-6">
              <Award className="h-10 w-10 text-slate-600 mx-auto mb-2.5" />
              <h4 className="font-semibold text-slate-300 text-sm">No saved sessions yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Complete a mock interview and click "Save to Firebase" in the debrief modal to archive your transcripts, diagrams, and scorecards!
              </p>
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 transition shadow-sm flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-100 text-sm leading-snug">{s.scenario}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          {formatDuration(s.durationSeconds)}
                        </span>
                        <span>•</span>
                        <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDecisionBadge(s.hiringDecision)}`}>
                        {s.hiringDecision}
                      </span>
                      {s.overallScore > 0 && (
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {s.overallScore}/100
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                      {s.messagesCount} turns
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => onDeleteSession(s.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition text-xs flex items-center gap-1"
                    title="Delete session"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>

                  <button
                    onClick={() => onSelectSession(s.id)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <span>View / Load</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
