import React, { useRef, useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Send, Radio, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface CandidateTileProps {
  isListening: boolean;
  isTranscribing: boolean;
  interimTranscript: string;
  micVolume: number;
  hasMicPermission: boolean | null;
  permissionError: string | null;
  onInitMic: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onSubmitSpeech: () => void;
  onManualTextSubmit: (text: string) => void;
  isAlexSpeaking: boolean;
  isThinking: boolean;
  autoSendEnabled: boolean;
  onToggleAutoSend: () => void;
}

const QUICK_STARTERS = [
  "React sends the question to Django. Django runs an SQL query in PostgreSQL to get document text and sends it to the AI model.",
  "When users upload a big PDF, Django runs a background Celery task with Redis so the React website stays fast and never blocks.",
  "In React, we use a simple streaming connection to show the AI answer word by word on the screen for the user.",
];

export const CandidateTile: React.FC<CandidateTileProps> = ({
  isListening,
  isTranscribing,
  interimTranscript,
  micVolume,
  hasMicPermission,
  permissionError,
  onInitMic,
  onStartListening,
  onStopListening,
  onSubmitSpeech,
  onManualTextSubmit,
  isAlexSpeaking,
  isThinking,
  autoSendEnabled,
  onToggleAutoSend,
}) => {
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [manualText, setManualText] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  // Toggle candidate webcam
  const toggleCamera = async () => {
    if (isVideoOn) {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
        videoStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsVideoOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsVideoOn(true);
      } catch (err) {
        console.warn('Unable to access webcam:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualText.trim()) {
      onManualTextSubmit(manualText.trim());
      setManualText('');
    }
  };

  const handleQuickStarter = (promptText: string) => {
    onManualTextSubmit(promptText);
  };

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-5 h-full min-h-[380px]">
      {/* Background camera feed or stylish avatar backdrop */}
      {isVideoOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover scale-x-[-1] opacity-50 pointer-events-none"
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950/40 to-slate-950/80" />
      )}

      {/* Top Header inside candidate tile */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs shadow-inner">
            You
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-slate-100 text-xs md:text-sm tracking-wide">Candidate</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 font-medium">
                Full Stack Python & Gen AI
              </span>
            </div>
          </div>
        </div>

        {/* Camera toggle & mode badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCamera}
            className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1 ${
              isVideoOn
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 hover:bg-indigo-600/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoOn ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline text-[11px]">{isVideoOn ? 'Cam' : 'No Cam'}</span>
          </button>

          <button
            onClick={onToggleAutoSend}
            className={`px-2 py-1 rounded-lg border text-[11px] transition flex items-center gap-1 ${
              autoSendEnabled
                ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
            title="Auto-send after silence"
          >
            <Radio className="h-3 w-3" />
            <span className="hidden sm:inline">{autoSendEnabled ? 'Auto-Send' : 'Push-to-Talk'}</span>
          </button>
        </div>
      </div>

      {/* Center: Speaking Status, Waveform Visualizer & Live Speech Transcript */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2">
        {/* Permission warning banner if blocked */}
        {hasMicPermission === false && (
          <div className="mb-2 w-full p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/50 flex items-center justify-between gap-2 text-xs text-amber-200">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Mic access needed. Click to grant permission:</span>
            </div>
            <button
              onClick={onInitMic}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-[11px]"
            >
              Enable Mic
            </button>
          </div>
        )}

        {/* Central mic icon / wave pulse */}
        <div className="relative mb-2">
          <button
            onClick={isListening ? onStopListening : onStartListening}
            disabled={isThinking}
            className={`relative flex h-20 w-20 items-center justify-center rounded-3xl border-2 transition-all duration-300 shadow-xl ${
              isListening
                ? 'border-emerald-500 bg-emerald-950/60 shadow-emerald-500/20 scale-105'
                : 'border-slate-800 bg-slate-900/80 hover:border-indigo-500/60 hover:bg-slate-850'
            }`}
            title={isListening ? 'Click to stop listening' : 'Click to start speaking'}
          >
            {isTranscribing ? (
              <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
            ) : (
              <Mic
                className={`h-8 w-8 transition-colors ${
                  isListening ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
                }`}
              />
            )}
          </button>
        </div>

        {/* Live Decibel Visualizer Meter */}
        <div className="flex items-center gap-1 h-4 mb-2">
          {[...Array(16)].map((_, i) => {
            const threshold = (i / 16) * 100;
            const active = micVolume > threshold;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${
                  active ? (i > 12 ? 'bg-amber-400 h-4' : 'bg-emerald-400 h-3.5') : 'bg-slate-800 h-1.5'
                }`}
              />
            );
          })}
        </div>

        {/* Live Speech Recognition & Transcript Caption Box */}
        <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center min-h-[50px] flex items-center justify-center">
          {isTranscribing ? (
            <p className="text-amber-300 text-xs flex items-center gap-1.5 font-mono">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Transcribing your audio with Gemini...
            </p>
          ) : interimTranscript ? (
            <p className="text-slate-100 text-xs md:text-sm font-medium leading-relaxed">
              "{interimTranscript}"
            </p>
          ) : isListening ? (
            <p className="text-emerald-400 text-xs flex items-center gap-1.5 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Listening... Speak your answer now
            </p>
          ) : isThinking ? (
            <p className="text-amber-400 text-xs font-mono">Alex is analyzing and formulating follow-up...</p>
          ) : isAlexSpeaking ? (
            <p className="text-indigo-300 text-xs font-mono">Alex is speaking. Listen or prepare answer.</p>
          ) : (
            <p className="text-slate-400 text-xs">
              Click the mic button or "Start Speaking" below to speak your answer.
            </p>
          )}
        </div>
      </div>

      {/* Bottom controls: Mic Button + Manual Text Input + Quick Prompts */}
      <div className="relative z-10 flex flex-col gap-2.5 pt-3 border-t border-slate-800/80">
        {/* Quick starter suggestions */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-400 scrollbar-none">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 shrink-0 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5 text-indigo-400" /> Quick Reply:
          </span>
          {QUICK_STARTERS.map((starter, i) => (
            <button
              key={i}
              onClick={() => handleQuickStarter(starter)}
              disabled={isThinking}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition text-[11px] truncate max-w-[200px]"
              title={starter}
            >
              {starter}
            </button>
          ))}
        </div>

        {/* Primary Action Row: Big Speak / Send button */}
        <div className="flex items-center gap-2">
          {isListening ? (
            <>
              <button
                onClick={onStopListening}
                className="flex items-center justify-center gap-1.5 bg-rose-600/80 hover:bg-rose-600 text-white font-medium py-2 px-3 rounded-xl text-xs transition"
              >
                <MicOff className="h-3.5 w-3.5" />
                Cancel
              </button>
              <button
                onClick={onSubmitSpeech}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition shadow-lg shadow-emerald-600/20"
              >
                <Send className="h-3.5 w-3.5" />
                Submit Spoken Answer
              </button>
            </>
          ) : (
            <button
              onClick={onStartListening}
              disabled={isThinking}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-xs md:text-sm transition shadow-lg shadow-indigo-600/20 active:scale-98"
            >
              <Mic className="h-4 w-4" />
              Start Speaking / Answer
            </button>
          )}
        </div>

        {/* Text Input Row directly available */}
        <form onSubmit={handleManualSubmit} className="flex gap-2 w-full">
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Or type candidate response here..."
            disabled={isThinking}
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal"
          />
          <button
            type="submit"
            disabled={!manualText.trim() || isThinking}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-700 transition"
          >
            <Send className="h-3 w-3" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
