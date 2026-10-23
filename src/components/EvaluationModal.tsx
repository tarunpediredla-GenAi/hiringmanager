import React from 'react';
import { X, Award, CheckCircle, AlertTriangle, BookOpen, RotateCcw, Download, CloudUpload, Check } from 'lucide-react';
import { EvaluationResult } from '../types/interview';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: EvaluationResult | null;
  isLoading: boolean;
  onRestart: () => void;
  onSaveToFirebase?: () => void;
  isSavingToFirebase?: boolean;
  saveSuccess?: boolean;
  isAuthenticated?: boolean;
  onPromptSignIn?: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  onClose,
  result,
  isLoading,
  onRestart,
  onSaveToFirebase,
  isSavingToFirebase,
  saveSuccess,
  isAuthenticated,
  onPromptSignIn,
}) => {
  if (!isOpen) return null;

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'Strong Hire':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20';
      case 'Hire':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-teal-500/20';
      case 'Lean Hire':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-blue-500/20';
      case 'Lean No Hire':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/20';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-500/20';
    }
  };

  const handleDownloadReport = () => {
    if (!result) return;
    const reportText = `=========================================
ALEX MOCK INTERVIEW EVALUATION DEBRIEF
Target Role: Senior Full Stack Python Developer with Gen AI (HTML, CSS, JS, React, SQL, Django, Gen AI)
=========================================
Decision: ${result.hiringDecision} (Score: ${result.overallScore}/100)

EXECUTIVE SUMMARY:
${result.executiveSummary}

DIMENSIONAL BREAKDOWN:
${result.dimensions.map((d) => `• ${d.name} (${d.score}/10): ${d.feedback}`).join('\n')}

KEY STRENGTHS:
${result.strengths.map((s) => `• ${s}`).join('\n')}

AREAS FOR GROWTH:
${result.gaps.map((g) => `• ${g}`).join('\n')}

RECOMMENDED READINGS & TOPICS:
${result.recommendedReadingsAndTopics.map((r) => `• ${r}`).join('\n')}

ACTIONABLE ADVICE:
${result.detailedActionableAdvice}
`;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Alex-Mock-Interview-Scorecard-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-base md:text-lg">
                Hiring Committee Evaluation Debrief
              </h2>
              <p className="text-xs text-slate-400">
                Calibrated assessment for Senior Full Stack Python Developer with Gen AI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="h-12 w-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <div>
                <h3 className="font-semibold text-slate-200 text-base">Alex & Hiring Committee are reviewing...</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Analyzing architectural soundness, latency trade-offs, vector retrieval depth, and communication conciseness.
                </p>
              </div>
            </div>
          ) : result ? (
            <>
              {/* Scorecard Hero Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/50 to-slate-950 border border-indigo-500/20 shadow-xl">
                <div>
                  <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider block mb-1">
                    Hiring Recommendation
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-lg md:text-xl font-bold px-4 py-1.5 rounded-xl border shadow-lg ${getDecisionBadge(
                        result.hiringDecision
                      )}`}
                    >
                      {result.hiringDecision}
                    </span>
                    <span className="text-sm text-slate-400 font-mono">
                      Overall Score: <strong className="text-white text-base">{result.overallScore}</strong>/100
                    </span>
                  </div>
                </div>

                <div className="w-full sm:w-48 bg-slate-800/80 rounded-full h-3 border border-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, result.overallScore)}%` }}
                  />
                </div>
              </div>

              {/* Executive Summary */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Executive Committee Summary
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed">{result.executiveSummary}</p>
              </div>

              {/* Dimensional Breakdown */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Core Evaluation Dimensions
                </h4>
                <div className="space-y-3">
                  {result.dimensions.map((dim, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-xs md:text-sm text-slate-200">{dim.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                dim.score >= 8
                                  ? 'bg-emerald-400'
                                  : dim.score >= 6
                                  ? 'bg-indigo-400'
                                  : 'bg-amber-400'
                              }`}
                              style={{ width: `${dim.score * 10}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold font-mono text-slate-300 w-8 text-right">
                            {dim.score}/10
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{dim.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Gaps 2-column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2.5">
                    <CheckCircle className="h-4 w-4" /> Demonstrated Strengths
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-200">
                    {result.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2.5">
                    <AlertTriangle className="h-4 w-4" /> Areas for Growth & Drill-Down
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-200">
                    {result.gaps.map((gap, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Readings & Topics */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 mb-2">
                  <BookOpen className="h-4 w-4" /> Recommended Technical Prep & Topics
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.recommendedReadingsAndTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-indigo-950/60 text-indigo-200 border border-indigo-800/50 text-xs font-mono"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Detailed Actionable Advice */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-700/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                  Advice for Real Interview Day
                </h4>
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                  {result.detailedActionableAdvice}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-slate-400">No evaluation data available.</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2 flex-wrap">
            {onSaveToFirebase && (
              <button
                onClick={isAuthenticated ? onSaveToFirebase : onPromptSignIn}
                disabled={!result || isLoading || isSavingToFirebase}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  saveSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                } disabled:opacity-50 shadow-md`}
                title="Save interview session, whiteboard diagram, and scorecard to Firestore"
              >
                {saveSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Saved to Firebase!
                  </>
                ) : (
                  <>
                    <CloudUpload className="h-3.5 w-3.5" />
                    {isSavingToFirebase ? 'Saving...' : isAuthenticated ? 'Save to Firebase' : 'Sign in to Save'}
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleDownloadReport}
              disabled={!result || isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Download Report
            </button>
            <button
              onClick={onRestart}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New Interview
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            Resume Interview
          </button>
        </div>
      </div>
    </div>
  );
};
