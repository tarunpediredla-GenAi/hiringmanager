import React from 'react';
import { Volume2, VolumeX, RotateCcw, Sparkles, BookOpen } from 'lucide-react';
import { InterviewStatus } from '../types/interview';

interface InterviewerTileProps {
  status: InterviewStatus;
  alexAudioLevel: number;
  latestMessage: string;
  isCorrection?: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onReplayAudio?: () => void;
  onChangeQuestion?: () => void;
  onOpenSyllabus?: () => void;
  voiceName: string;
  onChangeVoice: (voice: string) => void;
  speechRate: number;
  onChangeSpeechRate: (rate: number) => void;
}

export const InterviewerTile: React.FC<InterviewerTileProps> = ({
  status,
  alexAudioLevel,
  latestMessage,
  isCorrection,
  isMuted,
  onToggleMute,
  onReplayAudio,
  onChangeQuestion,
  onOpenSyllabus,
  voiceName,
  onChangeVoice,
  speechRate,
  onChangeSpeechRate,
}) => {
  const isSpeaking = status === 'speaking';
  const isListening = status === 'listening';
  const isThinking = status === 'thinking';

  // Detect correction from prop or text keywords
  const hasCorrectionText =
    isCorrection ||
    /(actually|not quite right|not quite|misconception|remember that|keep in mind|you're partly right|partially correct|the correct answer)/i.test(
      latestMessage || ''
    );

  // Dynamic wave bar heights for speaking animation
  const bars = [0.4, 0.8, 1.0, 0.6, 0.9, 0.5, 0.7, 1.0, 0.4];

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-6 h-full min-h-[380px]">
      {/* Background ambient glow effect responding to speech */}
      <div
        className="pointer-events-none absolute -inset-10 opacity-30 transition-all duration-300 blur-3xl"
        style={{
          background: isSpeaking
            ? `radial-gradient(circle, rgba(99, 102, 241, ${0.4 + alexAudioLevel * 0.005}) 0%, transparent 70%)`
            : isListening
            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Top Header inside tile */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 border border-indigo-400/30 text-white font-bold shadow-inner">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-100 text-sm tracking-wide">Alex</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 text-indigo-300 border border-indigo-500/40 font-medium flex items-center gap-1 shadow-sm">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                Gemini AI Interviewer
              </span>
            </div>
            <p className="text-xs text-slate-400">Senior Full Stack Python & Gen AI • Evaluates & Corrects Real-Time</p>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-medium animate-pulse">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              Speaking...
            </span>
          )}
          {isListening && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Listening to you...
            </span>
          )}
          {isThinking && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-medium animate-pulse">
              <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-400" />
              Gemini AI Evaluating...
            </span>
          )}
          {!isSpeaking && !isListening && !isThinking && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-400 text-xs">
              Ready
            </span>
          )}
        </div>
      </div>

      {/* Center: Alex's Video Stream & Interactive Audio Visualizer */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2">
        <div className="relative">
          {/* Active Speaking Ambient Glow Rings */}
          {isSpeaking && (
            <>
              <div
                className="absolute inset-0 rounded-3xl border-2 border-indigo-400/50 animate-ping duration-1000"
                style={{ transform: `scale(${1 + alexAudioLevel * 0.008})` }}
              />
              <div
                className="absolute -inset-3 rounded-3xl border border-indigo-400/30 transition-all duration-150"
                style={{ transform: `scale(${1 + alexAudioLevel * 0.005})` }}
              />
            </>
          )}

          {/* Alex's High-Definition Video Frame */}
          <div
            className={`relative w-48 h-48 sm:w-56 sm:h-56 md:w-60 md:h-60 rounded-3xl overflow-hidden border-2 transition-all duration-300 shadow-2xl ${
              isSpeaking
                ? 'border-indigo-400 ring-4 ring-indigo-500/50 shadow-indigo-500/40 scale-102'
                : isListening
                ? 'border-emerald-500/70 ring-2 ring-emerald-500/30'
                : 'border-slate-800'
            }`}
          >
            {/* Alex's Video Feed Image */}
            <img
              src={
                voiceName === 'Kore'
                  ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
                  : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'
              }
              alt="Alex Interviewer"
              className="w-full h-full object-cover select-none pointer-events-none"
            />

            {/* Top Left: Video Tag */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-[10px] text-slate-200 font-medium shadow-md">
              <span
                className={`h-2 w-2 rounded-full ${
                  isSpeaking
                    ? 'bg-indigo-400 animate-pulse'
                    : isListening
                    ? 'bg-emerald-400 animate-ping'
                    : 'bg-slate-400'
                }`}
              />
              <span>{isSpeaking ? 'Alex (Gemini Speaking)' : isListening ? 'Alex (Listening)' : 'Alex (Gemini AI)'}</span>
            </div>

            {/* Top Right: Model Badge */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-indigo-900/60 text-[9px] font-mono font-bold text-indigo-300">
              <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
              Gemini 3.1
            </div>

            {/* Bottom Audio Visualizer Bar when speaking */}
            {isSpeaking && (
              <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-slate-950/90 to-transparent flex items-end justify-center pb-2 gap-1 px-4">
                {bars.map((barFactor, i) => {
                  const height = Math.max(4, Math.round(barFactor * (alexAudioLevel / 100) * 24));
                  return (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-indigo-400 shadow-sm transition-all duration-75"
                      style={{ height: `${height}px` }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Real-time speech transcription caption box */}
        <div className="mt-4 max-w-lg w-full text-center px-4">
          {hasCorrectionText && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-medium shadow-sm">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Gemini AI Correction & Concept Clarification</span>
            </div>
          )}
          <p className="text-slate-200 text-xs sm:text-sm font-normal leading-relaxed line-clamp-3 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 shadow-md">
            "{latestMessage || 'Hi there! Ready when you are.'}"
          </p>
        </div>
      </div>

      {/* Bottom control bar inside interviewer tile */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Voice model selector */}
          <select
            value={voiceName}
            onChange={(e) => onChangeVoice(e.target.value)}
            className="text-xs bg-slate-800/90 text-slate-300 rounded-lg px-2.5 py-1.5 border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            title="Alex's voice model"
          >
            <option value="Puck">Voice: Puck (Friendly & Clear - Recommended)</option>
            <option value="Fenrir">Voice: Fenrir (Senior & Calm)</option>
            <option value="Kore">Voice: Kore (Gentle & Simple)</option>
            <option value="Zephyr">Voice: Zephyr (Direct & Clear)</option>
            <option value="Charon">Voice: Charon (Deep & Slow)</option>
          </select>

          {/* Speed selector */}
          <select
            value={speechRate}
            onChange={(e) => onChangeSpeechRate(Number(e.target.value))}
            className="text-xs bg-slate-800/90 text-slate-300 rounded-lg px-2 py-1.5 border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-mono"
            title="Alex's speaking speed"
          >
            <option value={0.80}>Speed: 0.80x (Slow & Clear)</option>
            <option value={0.85}>Speed: 0.85x (Easy to Listen)</option>
            <option value={0.92}>Speed: 0.92x (Moderate)</option>
            <option value={1.0}>Speed: 1.0x (Normal)</option>
          </select>

          {onReplayAudio && (
            <button
              onClick={onReplayAudio}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
              title="Replay Alex's question"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Replay
            </button>
          )}

          {onChangeQuestion && (
            <button
              onClick={onChangeQuestion}
              className="flex items-center gap-1 text-xs text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 px-2.5 py-1.5 rounded-lg border border-indigo-700/60 transition cursor-pointer"
              title="Ask next question from 50 Questions curriculum"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Next Q</span>
            </button>
          )}

          {onOpenSyllabus && (
            <button
              onClick={onOpenSyllabus}
              className="flex items-center gap-1 text-xs text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/80 px-2.5 py-1.5 rounded-lg border border-emerald-700/60 transition cursor-pointer"
              title="Open full 50-question syllabus and answers"
            >
              <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
              <span>50 Syllabus</span>
            </button>
          )}
        </div>

        {/* Audio mute toggle */}
        <button
          onClick={onToggleMute}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition ${
            isMuted
              ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/50'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          {isMuted ? 'Muted' : 'Audio On'}
        </button>
      </div>
    </div>
  );
};
