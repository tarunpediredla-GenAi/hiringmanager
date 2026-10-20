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

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'turn-1',
    role: 'alex',
    text: "Hi there, I'm Alex. Great to meet you! What role are you targeting today, and are we focusing on behavioral or technical practice?",
    timestamp: '00:00',
  },
  {
    id: 'turn-2',
    role: 'candidate',
    text: 'Thanks, Alex. I am preparing for a gen ai Senior Software Engineer position and would like to start with a technical deep dive into system design.',
    timestamp: '00:08',
  },
  {
    id: 'turn-3',
    role: 'alex',
    text: "Awesome, let's dive into system design. Suppose we are architecting a multi-tenant enterprise RAG platform that needs to serve thousands of queries per second over proprietary document embeddings with sub-200 millisecond latency. How would you scope the primary architectural components from ingestion to query serving?",
    timestamp: '00:15',
  },
];

const INITIAL_NODES: WhiteboardNode[] = [
  {
    id: 'node-1',
    label: 'API Gateway & Rate Limiter',
    category: 'compute',
    description: 'Handles token bucket rate limiting (2,500 RPS) and JWT auth.',
    x: 0,
    y: 0,
  },
  {
    id: 'node-2',
    label: 'Semantic Cache (Redis)',
    category: 'cache',
    description: 'Pre-computed embedding cosine similarity match (>0.94) to return instant cached responses in <15ms.',
    x: 0,
    y: 0,
  },
  {
    id: 'node-3',
    label: 'Vector DB (HNSW Index)',
    category: 'storage',
    description: 'Milvus/Pinecone partitioned by tenant ID, M=16, efConstruction=200 for sub-20ms ANN search.',
    x: 0,
    y: 0,
  },
];

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [status, setStatus] = useState<InterviewStatus>('idle');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [isMuted, setIsMuted] = useState(false);
  const [voiceName, setVoiceName] = useState('Fenrir');
  const [autoSendSilenceMs, setAutoSendSilenceMs] = useState(2200);
  const [scenario, setScenario] = useState('Gen AI Senior SWE: System Design Deep Dive');
  const [timerSeconds, setTimerSeconds] = useState(15);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Whiteboard state
  const [whiteboardNodes, setWhiteboardNodes] = useState<WhiteboardNode[]>(INITIAL_NODES);
  const [architectureNotes, setArchitectureNotes] = useState(
    '- QPS Peak: 2,500 queries/second\n- Latency Budget: P99 < 200ms (Embedding: 25ms, Vector search: 20ms, LLM TTFT: 80ms)\n- Cache: Redis Semantic Vector Cache\n- Failure Mode: Fallback to BM25 lexical search if vector service errors.'
  );
  const [isSharingWhiteboard, setIsSharingWhiteboard] = useState(false);
  const [sharedWhiteboardSuccess, setSharedWhiteboardSuccess] = useState(false);

  // Modals
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const whiteboardContextString = React.useMemo(() => {
    const nodesSummary = whiteboardNodes.map((n) => `[${n.label}] (${n.category}): ${n.description}`).join('\n');
    return `Components:\n${nodesSummary}\n\nTechnical Notes:\n${architectureNotes}`;
  }, [whiteboardNodes, architectureNotes]);

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
        const { reply } = await sendInterviewTurn(updatedHistory, scenario, whiteboardContextString);

        const replyTime = new Date((timerSeconds + 2) * 1000).toISOString().substr(14, 5);
        const alexMsg: ChatMessage = {
          id: `alex-${Date.now()}`,
          role: 'alex',
          text: reply,
          timestamp: replyTime,
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

  const latestAlexMessage = [...messages].reverse().find((m) => m.role === 'alex')?.text || '';

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
              <h1 className="font-bold text-slate-100 text-sm tracking-wide">Alex Interview Studio</h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Voice Session
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

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Session Settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>

          {/* End Interview & Scorecard Button */}
          <button
            onClick={handleConcludeInterview}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition active:scale-98"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            <span>End & Debrief</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-3 sm:p-4 md:p-5 overflow-hidden">
        {layoutMode === 'call' ? (
          /* Call Mode: Full Side-by-Side Video Conference */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            <InterviewerTile
              status={status}
              alexAudioLevel={alexAudioLevel}
              latestMessage={latestAlexMessage}
              isMuted={isMuted}
              onToggleMute={() => {
                if (!isMuted) stopAlexSpeaking();
                setIsMuted(!isMuted);
              }}
              onReplayAudio={handleReplayLatestAlex}
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
                  isMuted={isMuted}
                  onToggleMute={() => {
                    if (!isMuted) stopAlexSpeaking();
                    setIsMuted(!isMuted);
                  }}
                  onReplayAudio={handleReplayLatestAlex}
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
    </div>
  );
}
