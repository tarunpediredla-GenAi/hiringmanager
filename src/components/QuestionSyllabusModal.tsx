import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  BookOpen,
  Volume2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Code2,
} from 'lucide-react';
import { INTERVIEW_50_QUESTIONS, InterviewQuestion, CATEGORIES } from '../data/interviewQuestions';
import { ChatMessage } from '../types/interview';

interface QuestionSyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion: (question: InterviewQuestion) => void;
  messages: ChatMessage[];
  currentQuestionId?: number;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  HTML: { bg: 'bg-orange-950/60', text: 'text-orange-400', border: 'border-orange-800/60' },
  CSS: { bg: 'bg-sky-950/60', text: 'text-sky-400', border: 'border-sky-800/60' },
  JavaScript: { bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-800/60' },
  React: { bg: 'bg-cyan-950/60', text: 'text-cyan-400', border: 'border-cyan-800/60' },
  SQL: { bg: 'bg-emerald-950/60', text: 'text-emerald-400', border: 'border-emerald-800/60' },
  Django: { bg: 'bg-purple-950/60', text: 'text-purple-400', border: 'border-purple-800/60' },
  'Generative AI': { bg: 'bg-indigo-950/60', text: 'text-indigo-400', border: 'border-indigo-800/60' },
};

export const QuestionSyllabusModal: React.FC<QuestionSyllabusModalProps> = ({
  isOpen,
  onClose,
  onSelectQuestion,
  messages,
  currentQuestionId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [revealAllAnswers, setRevealAllAnswers] = useState(false);

  // Determine which questions have already been asked in the conversation
  const askedQuestionIds = useMemo(() => {
    const ids = new Set<number>();
    const allAlexText = messages
      .filter((m) => m.role === 'alex')
      .map((m) => m.text.toLowerCase())
      .join(' ');

    INTERVIEW_50_QUESTIONS.forEach((q) => {
      // Check if question prompt or main keywords appear in transcript
      const qKeywords = q.keywords.slice(0, 2);
      const isMatch =
        allAlexText.includes(q.question.toLowerCase().slice(0, 25)) ||
        qKeywords.some((kw) => allAlexText.includes(kw.toLowerCase()));
      if (isMatch) {
        ids.add(q.id);
      }
    });
    return ids;
  }, [messages]);

  // Filtered list
  const filteredQuestions = useMemo(() => {
    return INTERVIEW_50_QUESTIONS.filter((q) => {
      const matchesCat = selectedCategory === 'All' || q.category === selectedCategory;
      const qLower = q.question.toLowerCase();
      const aLower = q.canonicalAnswer.toLowerCase();
      const queryLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !queryLower ||
        qLower.includes(queryLower) ||
        aLower.includes(queryLower) ||
        q.keywords.some((k) => k.toLowerCase().includes(queryLower));
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-4xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Alex's Master 50 Questions Curriculum
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                  50 Official Questions
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Senior Full Stack Python Developer with Gen AI — HTML, CSS, JS, React, SQL, Django & Gen AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar: Category filter + Search */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/40 flex flex-col gap-3">
          {/* Categories Pill selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count =
                cat === 'All'
                  ? INTERVIEW_50_QUESTIONS.length
                  : INTERVIEW_50_QUESTIONS.filter((q) => q.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/60'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search bar & Show/Hide answers toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search question, keyword, or concept (e.g. closure, RAG, JOIN, DOM, async)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => setRevealAllAnswers((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>{revealAllAnswers ? 'Hide All Answers' : 'Reveal All Answers (Study Mode)'}</span>
            </button>
          </div>
        </div>

        {/* Question List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5 divide-y divide-slate-800/40">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              No questions found matching your search. Try adjusting keywords or category.
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isExpanded = revealAllAnswers || expandedIds.has(q.id);
              const isAsked = askedQuestionIds.has(q.id);
              const isCurrent = currentQuestionId === q.id;
              const catColor = CATEGORY_COLORS[q.category] || {
                bg: 'bg-slate-800',
                text: 'text-slate-300',
                border: 'border-slate-700',
              };

              return (
                <div
                  key={q.id}
                  className={`pt-3.5 first:pt-0 transition-all ${
                    isCurrent ? 'ring-2 ring-indigo-500/50 rounded-xl p-3 bg-indigo-950/20' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800/90 hover:border-slate-700/80 transition">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                          Q{q.id}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${catColor.bg} ${catColor.text} ${catColor.border}`}
                        >
                          {q.category}
                        </span>
                        {isAsked && (
                          <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-700/50 text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Asked in Interview
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
                        {q.question}
                      </h4>

                      {/* Keywords preview */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {q.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50 font-mono"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>

                      {/* Code snippet if any */}
                      {q.codeSnippet && (
                        <pre className="mt-2 text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-indigo-300 overflow-x-auto">
                          <code>{q.codeSnippet}</code>
                        </pre>
                      )}

                      {/* Expandable canonical answer */}
                      {isExpanded && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1.5 text-xs sm:text-sm animate-in fade-in duration-150">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                            <Sparkles className="h-3.5 w-3.5" />
                            Official Canonical Answer
                          </div>
                          <p className="text-slate-300 leading-relaxed font-normal">
                            {q.canonicalAnswer}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions on question */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
                      <button
                        onClick={() => {
                          onSelectQuestion(q);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition cursor-pointer"
                        title="Have Alex ask this exact question out loud in the interview"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>Ask Alex This</span>
                      </button>

                      <button
                        onClick={() => toggleExpand(q.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Answer' : 'View Answer'}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>
              Covered: {askedQuestionIds.size} of {INTERVIEW_50_QUESTIONS.length} Questions
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
          >
            Close Syllabus
          </button>
        </div>
      </div>
    </div>
  );
};
