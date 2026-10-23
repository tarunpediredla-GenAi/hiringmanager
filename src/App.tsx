import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layers,
  MessageSquare,
  Award,
  Settings as SettingsIcon,
  HelpCircle,
  PhoneOff,
  Sparkles,
  Maximize2,
  Columns,
  Headphones,
  Lightbulb,
  BookOpen,
} from 'lucide-react';
import { ChatMessage, EvaluationResult, InterviewStatus, LayoutMode, WhiteboardNode } from './types/interview';
import { sendInterviewTurn, evaluateInterview } from './services/api';
import { useVoice } from './hooks/useVoice';
import { InterviewerTile } from './components/InterviewerTile';
import { CandidateTile } from './components/CandidateTile';
import { Whiteboard } from './components/Whiteboard';
import { TranscriptDrawer } from './components/TranscriptDrawer';
import { EvaluationModal } from './components/EvaluationModal';
import { SettingsModal } from './components/SettingsModal';
import { SavedSessionsDrawer } from './components/SavedSessionsDrawer';
import { TipsSidebar } from './components/TipsSidebar';
import { QuestionSyllabusModal } from './components/QuestionSyllabusModal';
import { INTERVIEW_50_QUESTIONS, InterviewQuestion } from './data/interviewQuestions';
import { auth, onAuthStateChanged, User } from './firebase/config';
import {
  loginWithGoogle,
  logoutUser,
  saveInterviewToFirestore,
  fetchSessionDetail,
  deleteSessionFromFirestore,
  subscribeToUserSessions,
  SavedSessionSummary,
} from './firebase/firebaseService';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'turn-1',
    role: 'alex',
    text: "Hello! Welcome to your mock interview. I am Alex, your AI interviewer powered by Google Gemini. I will guide you through our 50-question full-stack curriculum, listen closely to your answers, and actively correct any mistakes so you can master each concept. Let's begin: What is the difference between async and defer in HTML?",
    timestamp: '00:00',
  },
];

const INITIAL_NODES: WhiteboardNode[] = [
  {
    id: 'node-1',
    label: 'React Frontend (HTML/CSS/JS)',
    category: 'compute',
    description: 'React UI components styled with CSS and HTML5, using JavaScript fetch to communicate with Django REST APIs.',
    x: 0,
    y: 0,
  },
  {
    id: 'node-2',
    label: 'Django REST API (Python)',
    category: 'compute',
    description: 'Django views, serializers, and url routing in Python handling requests and business logic.',
    x: 0,
    y: 0,
  },
  {
    id: 'node-3',
    label: 'PostgreSQL Database (SQL)',
    category: 'storage',
    description: 'Relational SQL tables for users, questions, and responses managed via Django ORM models.',
    x: 0,
    y: 0,
  },
  {
    id: 'node-4',
    label: 'Gen AI Pipeline (Gemini API)',
    category: 'compute',
    description: 'Google Gemini AI called from Python Django backend to generate answers and stream them to React.',
    x: 0,
    y: 0,
  },
];

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [status, setStatus] = useState<InterviewStatus>('idle');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [isMuted, setIsMuted] = useState(false);
  const [voiceName, setVoiceName] = useState('Puck');
  const [autoSendSilenceMs, setAutoSendSilenceMs] = useState(2200);
  const [scenario, setScenario] = useState('Senior Full Stack Python Developer with Gen AI (HTML, CSS, JS, React, SQL, Django, Gen AI)');
  const [timerSeconds, setTimerSeconds] = useState(15);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // 50-Question Master Syllabus State
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState<number>(1);

  // Whiteboard state
  const [whiteboardNodes, setWhiteboardNodes] = useState<WhiteboardNode[]>(INITIAL_NODES);
  const [architectureNotes, setArchitectureNotes] = useState(
    '- Frontend: React, HTML5, CSS3, JavaScript (fetch/axios for API calls).\n- Backend: Python 3.12 + Django REST Framework (DRF) handling views and serializers.\n- Database: PostgreSQL (SQL) with relational tables, foreign keys, and Django ORM.\n- Gen AI: Google Gemini API integration in Python for intelligent answers and streaming responses.'
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isSharingWhiteboard, setIsSharingWhiteboard] = useState(false);
  const [sharedWhiteboardSuccess, setSharedWhiteboardSuccess] = useState(false);

  // Modals
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Firebase Auth & Firestore State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [savedSessions, setSavedSessions] = useState<SavedSessionSummary[]>([]);
  const [isSavedSessionsOpen, setIsSavedSessionsOpen] = useState(false);
  const [isSavingToFirebase, setIsSavingToFirebase] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoadingSessionDetail, setIsLoadingSessionDetail] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to real-time interview sessions in Firestore when user logged in
  useEffect(() => {
    if (!currentUser) {
      setSavedSessions([]);
      return;
    }
    const unsubscribe = subscribeToUserSessions(currentUser.uid, (data) => {
      setSavedSessions(data);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by browser. Please allow popups for Google Sign-In.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed before completing.');
      } else {
        setAuthError(err?.message || 'Authentication error. Please try again.');
      }
      setTimeout(() => setAuthError(null), 5000);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsSavedSessionsOpen(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSaveToFirebase = async () => {
    if (!currentUser) {
      await handleGoogleLogin();
      return;
    }
    setIsSavingToFirebase(true);
    try {
      await saveInterviewToFirestore(
        currentUser.uid,
        scenario,
        timerSeconds,
        messages,
        whiteboardNodes,
        architectureNotes,
        evaluationResult
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save interview to Firestore:', err);
    } finally {
      setIsSavingToFirebase(false);
    }
  };

  const handleSelectSavedSession = async (sessionId: string) => {
    if (!currentUser) return;
    setIsLoadingSessionDetail(true);
    try {
      const detail = await fetchSessionDetail(currentUser.uid, sessionId);
      if (detail) {
        setMessages(detail.messages || []);
        setWhiteboardNodes(detail.whiteboardNodes || []);
        setArchitectureNotes(detail.architectureNotes || '');
        setEvaluationResult(detail.evaluationResult);
        setIsSavedSessionsOpen(false);
        setIsEvalModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setIsLoadingSessionDetail(false);
    }
  };

  const handleDeleteSavedSession = async (sessionId: string) => {
    if (!currentUser) return;
    try {
      await deleteSessionFromFirestore(currentUser.uid, sessionId);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const [fullStackCode, setFullStackCode] = useState(
    'React fetch stream connected to Django REST Framework StreamingHttpResponse using PostgreSQL pgvector cosine similarity search.'
  );

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const whiteboardContextString = React.useMemo(() => {
    const nodesSummary = whiteboardNodes.map((n) => `[${n.label}] (${n.category}): ${n.description}`).join('\n');
    return `Full Stack Architecture Components (React, Django, SQL, Gen AI):\n${nodesSummary}\n\nTechnical Notes:\n${architectureNotes}\n\nCode & Query Implementation (React, Django DRF, SQL pgvector):\n${fullStackCode}`;
  }, [whiteboardNodes, architectureNotes, fullStackCode]);

  // Handle Candidate turn submission (voice or text)
  const handleCandidateSubmit = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const formattedTime = new Date(timerSeconds * 1000).toISOString().substr(14, 5);
      const newCandidateMsg: ChatMessage = {
        id: `turn-${Date.now()}`,
        role: 'candidate',
        text: text.trim(),
        timestamp: formattedTime,
      };

      const updatedHistory = [...messagesRef.current, newCandidateMsg];
      setMessages(updatedHistory);
      setStatus('thinking');

      try {
        const { reply, isCorrection } = await sendInterviewTurn(updatedHistory, scenario, whiteboardContextString);

        const replyTime = new Date((timerSeconds + 2) * 1000).toISOString().substr(14, 5);
        const alexMsg: ChatMessage = {
          id: `alex-${Date.now()}`,
          role: 'alex',
          text: reply,
          timestamp: replyTime,
          isCorrection,
        };

        const finalHistory = [...updatedHistory, alexMsg];
        setMessages(finalHistory);

        // Speak response if not muted
        if (!isMuted) {
          setStatus('speaking');
          speakAsAlex(reply, () => {
            setStatus('listening');
            startListening();
          });
        } else {
          setStatus('idle');
        }
      } catch (err: any) {
        console.error('Failed to get interview turn:', err);
        setStatus('idle');
      }
    },
    [timerSeconds, scenario, whiteboardContextString, isMuted]
  );

  // Setup Voice hook
  const {
    isListening,
    isTranscribing,
    interimTranscript,
    micVolume,
    hasMicPermission,
    permissionError,
    initMicAudio,
    startListening,
    stopListening,
    submitCurrentSpeech,
    speechRate,
    setSpeechRate,
    isAlexSpeaking,
    alexAudioLevel,
    speakAsAlex,
    stopAlexSpeaking,
  } = useVoice({
    onCandidateSpeechSubmit: handleCandidateSubmit,
    autoSendAfterSilenceMs: autoSendSilenceMs,
    voiceName,
  });

  // Keep status in sync with voice
  useEffect(() => {
    if (isAlexSpeaking) {
      setStatus('speaking');
    } else if (isListening) {
      setStatus('listening');
    } else if (status !== 'thinking') {
      setStatus('idle');
    }
  }, [isAlexSpeaking, isListening]);

  // Session timer ticker
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Format timer
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Replay latest question from Alex
  const handleReplayLatestAlex = () => {
    const lastAlexMsg = [...messages].reverse().find((m) => m.role === 'alex');
    if (lastAlexMsg) {
      stopAlexSpeaking();
      setStatus('speaking');
      speakAsAlex(lastAlexMsg.text, () => {
        setStatus('listening');
      });
    }
  };

  // Switch to the next topic question in the 50-Question Master Curriculum
  const handleChangeQuestion = useCallback(() => {
    stopAlexSpeaking();
    const nextIdx = (questionIndex + 1) % INTERVIEW_50_QUESTIONS.length;
    setQuestionIndex(nextIdx);
    const nextQ = INTERVIEW_50_QUESTIONS[nextIdx];
    setCurrentQuestionId(nextQ.id);
    const nextTime = formatTimer(timerSeconds);
    const spokenText = `Let's move to Question ${nextQ.id} on ${nextQ.category}: ${nextQ.question}`;
    const alexMsg: ChatMessage = {
      id: `alex-${Date.now()}`,
      role: 'alex',
      text: spokenText,
      timestamp: nextTime,
    };
    setMessages((prev) => [...prev, alexMsg]);
    if (!isMuted) {
      setStatus('speaking');
      speakAsAlex(spokenText, () => {
        setStatus('listening');
        startListening();
      });
    } else {
      setStatus('idle');
    }
  }, [questionIndex, timerSeconds, isMuted, speakAsAlex, stopAlexSpeaking, startListening]);

  // Select a specific question directly from the 50 Questions Syllabus modal
  const handleSelectSyllabusQuestion = useCallback(
    (q: InterviewQuestion) => {
      stopAlexSpeaking();
      setCurrentQuestionId(q.id);
      const idx = INTERVIEW_50_QUESTIONS.findIndex((item) => item.id === q.id);
      if (idx !== -1) setQuestionIndex(idx);
      const nextTime = formatTimer(timerSeconds);
      const spokenText = `Great! Let's practice Question ${q.id} on ${q.category}: ${q.question}`;
      const alexMsg: ChatMessage = {
        id: `alex-${Date.now()}`,
        role: 'alex',
        text: spokenText,
        timestamp: nextTime,
      };
      setMessages((prev) => [...prev, alexMsg]);
      if (!isMuted) {
        setStatus('speaking');
        speakAsAlex(spokenText, () => {
          setStatus('listening');
          startListening();
        });
      } else {
        setStatus('idle');
      }
    },
    [timerSeconds, isMuted, speakAsAlex, stopAlexSpeaking, startListening]
  );

  // Trigger evaluation
  const handleConcludeInterview = async () => {
    setIsTimerRunning(false);
    stopListening();
    stopAlexSpeaking();
    setIsEvalModalOpen(true);
    setIsEvaluating(true);

    try {
      const result = await evaluateInterview(messages, scenario, whiteboardContextString);
      setEvaluationResult(result);
    } catch (err) {
      console.error('Failed to evaluate:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Share whiteboard context with Alex
  const handleShareWhiteboard = () => {
    setIsSharingWhiteboard(true);
    setTimeout(() => {
      setIsSharingWhiteboard(false);
      setSharedWhiteboardSuccess(true);
      setTimeout(() => setSharedWhiteboardSuccess(false), 2500);
    }, 400);
  };

  // Quick Hint / Clarification
  const handleAskClarification = () => {
    handleCandidateSubmit("Alex, could you clarify our SLA latency requirements and expected document update frequency?");
  };

  // Restart interview
  const handleRestart = () => {
    stopListening();
    stopAlexSpeaking();
    setMessages(INITIAL_MESSAGES);
    setTimerSeconds(15);
    setIsTimerRunning(true);
    setEvaluationResult(null);
    setIsEvalModalOpen(false);
    setStatus('idle');
  };

  const latestAlexMsg = [...messages].reverse().find((m) => m.role === 'alex');
  const latestAlexMessage = latestAlexMsg?.text || '';
  const latestAlexIsCorrection = latestAlexMsg?.isCorrection;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold text-sm shadow-md shadow-indigo-500/20">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-100 text-sm tracking-wide flex items-center gap-1.5">
                <span>Alex</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 border border-indigo-500/40 text-indigo-300 font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-indigo-400" />
                  Gemini AI
                </span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Voice & Auto-Correction
              </span>
            </div>
          </div>
        </div>

        {/* Center: Scenario & Timer Pill */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Topic:</span>
            <span className="text-slate-200 font-semibold">{scenario}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            {formatTimer(timerSeconds)}
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {/* Layout Mode Toggles */}
          <div className="hidden sm:flex bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setLayoutMode('split')}
              className={`p-1.5 rounded-lg transition ${
                layoutMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Split View (Call + Whiteboard)"
            >
              <Columns className="h-4 w-4" />
            </button>
            <button
              onClick={() => setLayoutMode('call')}
              className={`p-1.5 rounded-lg transition ${
                layoutMode === 'call' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Call Focused View"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setLayoutMode('whiteboard')}
              className={`p-1.5 rounded-lg transition ${
                layoutMode === 'whiteboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Whiteboard Focused View"
            >
              <Layers className="h-4 w-4" />
            </button>
          </div>

          {/* 50 Questions Master Curriculum Syllabus */}
          <button
            onClick={() => setIsSyllabusOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-200 hover:text-white transition font-medium cursor-pointer shadow-sm"
            title="Browse all 50 official questions and canonical answers"
          >
            <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-semibold">50 Questions</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-800 text-indigo-200 font-mono text-[10px]">
              Syllabus
            </span>
          </button>

          {/* Transcript Drawer Toggle */}
          <button
            onClick={() => setIsTranscriptOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
            title="Open conversation transcript"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Transcript</span>
          </button>

          {/* Quick Clarification / Hint */}
          <button
            onClick={handleAskClarification}
            disabled={status === 'thinking' || status === 'speaking'}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition disabled:opacity-40"
            title="Ask Alex to clarify constraints"
          >
            <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
            <span>Clarify SLA</span>
          </button>

          {/* System Design Tips & Playbook Toggle */}
          <button
            onClick={() => setIsTipsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/50 text-amber-300 hover:text-amber-200 transition"
            title="System Design Interview Tips, Questions & Pitfalls"
          >
            <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Tips</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Session Settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>

          {/* Past Interviews (Firebase Firestore) */}
          {currentUser && (
            <button
              onClick={() => setIsSavedSessionsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-700/60 text-indigo-200 transition"
              title="View saved interview sessions in Firestore"
            >
              <Award className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Past Interviews</span>
              {savedSessions.length > 0 && (
                <span className="h-4 px-1.5 rounded-full bg-indigo-500 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                  {savedSessions.length}
                </span>
              )}
            </button>
          )}

          {/* End Interview & Scorecard Button */}
          <button
            onClick={handleConcludeInterview}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition active:scale-98"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            <span>End & Debrief</span>
          </button>

          {/* Google Auth Button / User Profile */}
          {isAuthLoading ? (
            <div className="h-7 w-7 rounded-xl bg-slate-800 animate-pulse" />
          ) : currentUser ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
              <div className="flex items-center gap-1.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="h-7 w-7 rounded-full border border-indigo-500/50"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="hidden xl:inline text-xs font-medium text-slate-300 max-w-[90px] truncate">
                  {currentUser.displayName || 'Candidate'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-2 py-1 rounded-lg transition"
                title="Sign out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition font-medium shadow-sm"
              title="Sign in with Google to save interview sessions in Firebase"
            >
              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Auth Error Notification Banner */}
      {authError && (
        <div className="bg-amber-950/90 border-b border-amber-600/70 px-4 py-2 text-xs text-amber-200 flex items-center justify-between z-30 shadow-md">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span>{authError}</span>
          </div>
          <button
            onClick={() => setAuthError(null)}
            className="text-amber-400 hover:text-white px-2 py-0.5 rounded transition font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 p-3 sm:p-4 md:p-5 overflow-hidden">
        {layoutMode === 'call' ? (
          /* Call Mode: Full Side-by-Side Video Conference */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            <InterviewerTile
              status={status}
              alexAudioLevel={alexAudioLevel}
              latestMessage={latestAlexMessage}
              isCorrection={latestAlexIsCorrection}
              isMuted={isMuted}
              onToggleMute={() => {
                if (!isMuted) stopAlexSpeaking();
                setIsMuted(!isMuted);
              }}
              onReplayAudio={handleReplayLatestAlex}
              onChangeQuestion={handleChangeQuestion}
              onOpenSyllabus={() => setIsSyllabusOpen(true)}
              voiceName={voiceName}
              onChangeVoice={setVoiceName}
              speechRate={speechRate}
              onChangeSpeechRate={setSpeechRate}
            />
            <CandidateTile
              isListening={isListening}
              isTranscribing={isTranscribing}
              interimTranscript={interimTranscript}
              micVolume={micVolume}
              hasMicPermission={hasMicPermission}
              permissionError={permissionError}
              onInitMic={initMicAudio}
              onStartListening={startListening}
              onStopListening={stopListening}
              onSubmitSpeech={submitCurrentSpeech}
              onManualTextSubmit={handleCandidateSubmit}
              isAlexSpeaking={isAlexSpeaking}
              isThinking={status === 'thinking'}
              autoSendEnabled={autoSendSilenceMs > 0}
              onToggleAutoSend={() => setAutoSendSilenceMs(autoSendSilenceMs > 0 ? 0 : 2200)}
            />
          </div>
        ) : layoutMode === 'split' ? (
          /* Split Mode: Call tiles stacked on left + Whiteboard Architecture Canvas on right */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
            <div className="lg:col-span-5 flex flex-col gap-4 h-full overflow-y-auto">
              <div className="flex-1 min-h-[260px]">
                <InterviewerTile
                  status={status}
                  alexAudioLevel={alexAudioLevel}
                  latestMessage={latestAlexMessage}
                  isCorrection={latestAlexIsCorrection}
                  isMuted={isMuted}
                  onToggleMute={() => {
                    if (!isMuted) stopAlexSpeaking();
                    setIsMuted(!isMuted);
                  }}
                  onReplayAudio={handleReplayLatestAlex}
                  onChangeQuestion={handleChangeQuestion}
                  onOpenSyllabus={() => setIsSyllabusOpen(true)}
                  voiceName={voiceName}
                  onChangeVoice={setVoiceName}
                  speechRate={speechRate}
                  onChangeSpeechRate={setSpeechRate}
                />
              </div>
              <div className="flex-1 min-h-[260px]">
                <CandidateTile
                  isListening={isListening}
                  isTranscribing={isTranscribing}
                  interimTranscript={interimTranscript}
                  micVolume={micVolume}
                  hasMicPermission={hasMicPermission}
                  permissionError={permissionError}
                  onInitMic={initMicAudio}
                  onStartListening={startListening}
                  onStopListening={stopListening}
                  onSubmitSpeech={submitCurrentSpeech}
                  onManualTextSubmit={handleCandidateSubmit}
                  isAlexSpeaking={isAlexSpeaking}
                  isThinking={status === 'thinking'}
                  autoSendEnabled={autoSendSilenceMs > 0}
                  onToggleAutoSend={() => setAutoSendSilenceMs(autoSendSilenceMs > 0 ? 0 : 2200)}
                />
              </div>
            </div>

            <div className="lg:col-span-7 h-full">
              <Whiteboard
                nodes={whiteboardNodes}
                onAddNode={(node) =>
                  setWhiteboardNodes((prev) => [...prev, { ...node, id: `node-${Date.now()}` }])
                }
                onRemoveNode={(id) =>
                  setWhiteboardNodes((prev) => prev.filter((n) => n.id !== id))
                }
                onUpdateNodeDescription={(id, description) =>
                  setWhiteboardNodes((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, description } : n))
                  )
                }
                architectureNotes={architectureNotes}
                onChangeNotes={setArchitectureNotes}
                onShareWithAlex={handleShareWhiteboard}
                isSharing={isSharingWhiteboard}
                sharedSuccess={sharedWhiteboardSuccess}
                onCodeChange={setFullStackCode}
              />
            </div>
          </div>
        ) : (
          /* Whiteboard Focus Mode */
          <div className="h-full flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">Alex's Last Prompt:</span>
                <span className="text-slate-300 italic">"{latestAlexMessage}"</span>
              </div>
              <button
                onClick={handleReplayLatestAlex}
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
              >
                <Headphones className="h-3.5 w-3.5" /> Replay Voice
              </button>
            </div>
            <div className="flex-1">
              <Whiteboard
                nodes={whiteboardNodes}
                onAddNode={(node) =>
                  setWhiteboardNodes((prev) => [...prev, { ...node, id: `node-${Date.now()}` }])
                }
                onRemoveNode={(id) =>
                  setWhiteboardNodes((prev) => prev.filter((n) => n.id !== id))
                }
                onUpdateNodeDescription={(id, description) =>
                  setWhiteboardNodes((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, description } : n))
                  )
                }
                architectureNotes={architectureNotes}
                onChangeNotes={setArchitectureNotes}
                onShareWithAlex={handleShareWhiteboard}
                isSharing={isSharingWhiteboard}
                sharedSuccess={sharedWhiteboardSuccess}
                onCodeChange={setFullStackCode}
              />
            </div>
          </div>
        )}
      </main>

      {/* Slide-out Transcript Drawer */}
      <TranscriptDrawer
        isOpen={isTranscriptOpen}
        onClose={() => setIsTranscriptOpen(false)}
        messages={messages}
        onPlayTurnAudio={(text) => {
          stopAlexSpeaking();
          speakAsAlex(text);
        }}
      />

      {/* Hiring Committee Evaluation Modal */}
      <EvaluationModal
        isOpen={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        result={evaluationResult}
        isLoading={isEvaluating}
        onRestart={handleRestart}
        onSaveToFirebase={handleSaveToFirebase}
        isSavingToFirebase={isSavingToFirebase}
        saveSuccess={saveSuccess}
        isAuthenticated={!!currentUser}
        onPromptSignIn={handleGoogleLogin}
      />

      {/* Saved Sessions Drawer (Firebase Firestore) */}
      <SavedSessionsDrawer
        isOpen={isSavedSessionsOpen}
        onClose={() => setIsSavedSessionsOpen(false)}
        sessions={savedSessions}
        isLoading={isLoadingSessionDetail}
        onSelectSession={handleSelectSavedSession}
        onDeleteSession={handleDeleteSavedSession}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        voiceName={voiceName}
        onChangeVoice={setVoiceName}
        autoSendSilenceMs={autoSendSilenceMs}
        onChangeAutoSendSilenceMs={setAutoSendSilenceMs}
        selectedScenario={scenario}
        onSelectScenario={(s) => {
          setScenario(s);
          setIsSettingsOpen(false);
        }}
        speechRate={speechRate}
        onChangeSpeechRate={setSpeechRate}
      />

      {/* Floating Action Button (FAB): System Design Tips */}
      <button
        onClick={() => setIsTipsOpen(true)}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-xl shadow-amber-500/30 border border-amber-200/50 transition-all duration-200 hover:scale-105 active:scale-95 group cursor-pointer"
        title="Open System Design Interview Playbook, Clarifying Questions & Pitfalls"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-40"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
        </span>
        <Lightbulb className="h-4 w-4 text-slate-950 group-hover:rotate-12 transition-transform" />
        <span className="tracking-wide">Tips & Playbook</span>
      </button>

      {/* System Design Tips & Clarifying Questions Sidebar */}
      <TipsSidebar
        isOpen={isTipsOpen}
        onClose={() => setIsTipsOpen(false)}
        onInjectQuestion={(q) => handleCandidateSubmit(q)}
      />

      {/* 50 Questions Curriculum Syllabus Modal */}
      <QuestionSyllabusModal
        isOpen={isSyllabusOpen}
        onClose={() => setIsSyllabusOpen(false)}
        onSelectQuestion={handleSelectSyllabusQuestion}
        messages={messages}
        currentQuestionId={currentQuestionId}
      />
    </div>
  );
}
