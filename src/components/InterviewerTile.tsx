import React from 'react';
import { Volume2, VolumeX, RotateCcw, Sparkles } from 'lucide-react';
import { InterviewStatus } from '../types/interview';

interface InterviewerTileProps {
  status: InterviewStatus;
  alexAudioLevel: number;
  latestMessage: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onReplayAudio?: () => void;
  voiceName: string;
  onChangeVoice: (voice: string) => void;
  speechRate: number;
  onChangeSpeechRate: (rate: number) => void;
}

export const InterviewerTile: React.FC<InterviewerTileProps> = ({
  status,
  alexAudioLevel,
  latestMessage,
  isMuted,
  onToggleMute,
  onReplayAudio,
  voiceName,
  onChangeVoice,
  speechRate,
  onChangeSpeechRate,
}) => {
  const isSpeaking = status === 'speaking';
  const isListening = status === 'listening';
  const isThinking = status === 'thinking';

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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-semibold shadow-inner">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-100 text-sm tracking-wide">Alex</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
                Interviewer
              </span>
            </div>
            <p className="text-xs text-slate-400">Gen AI & Systems Hiring Committee</p>
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
              Evaluating...
            </span>
          )}
          {!isSpeaking && !isListening && !isThinking && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-400 text-xs">
              Ready
            </span>
          )}
        </div>
      </div>

      {/* Center: High-Tech Avatar & Interactive Audio Visualizer */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-6">
        <div className="relative">
          {/* Concentric audio pulse rings when Alex speaks */}
          {isSpeaking && (
            <>
              <div
                className="absolute inset-0 rounded-full border border-indigo-500/30 animate-ping duration-1000"
                style={{ transform: `scale(${1 + alexAudioLevel * 0.008})` }}
              />
              <div
                className="absolute -inset-4 rounded-full border border-indigo-400/20 transition-all duration-150"
                style={{ transform: `scale(${1 + alexAudioLevel * 0.005})` }}
              />
            </>
          )}

          {/* Avatar frame */}
          <div
            className={`relative flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border-2 transition-all duration-300 shadow-2xl ${
              isSpeaking
                ? 'border-indigo-400 shadow-indigo-500/30 scale-105'
                : isListening
                ? 'border-emerald-500/50 shadow-emerald-500/20'
                : 'border-slate-800'
            }`}
          >
            {/* Minimalist modern executive interviewer face / waveform core */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/30 border border-indigo-400/40 shadow-inner">
                {isSpeaking ? (
                  <div className="flex items-center gap-1 h-8">
                    {bars.map((barFactor, i) => {
                      const height = Math.max(4, Math.round(barFactor * (alexAudioLevel / 100) * 32));
                      return (
                        <div
                          key={i}
                          className="w-1 rounded-full bg-indigo-300 transition-all duration-75"
                          style={{ height: `${height}px` }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="relative">
                    <div className="h-6 w-6 rounded-full border-2 border-indigo-400/60 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-indigo-400" />
                    </div>
                  </div>
                )}
              </div>

              <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400">
                {isSpeaking ? 'Voice Active' : 'Online'}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time speech transcription caption box */}
        <div className="mt-6 max-w-lg w-full text-center px-4">
          <p className="text-slate-200 text-sm md:text-base font-normal leading-relaxed line-clamp-3 italic">
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
            <option value="Fenrir">Voice: Fenrir (Natural / Authoritative)</option>
            <option value="Puck">Voice: Puck (Warm / Conversational)</option>
            <option value="Zephyr">Voice: Zephyr (Crisp / Analytical)</option>
            <option value="Kore">Voice: Kore (Clear / Professional)</option>
            <option value="Charon">Voice: Charon (Deep / Measured)</option>
          </select>

          {/* Speed selector */}
          <select
            value={speechRate}
            onChange={(e) => onChangeSpeechRate(Number(e.target.value))}
            className="text-xs bg-slate-800/90 text-slate-300 rounded-lg px-2 py-1.5 border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-mono"
            title="Alex's speaking speed"
          >
            <option value={0.82}>Speed: 0.82x (Very Slow)</option>
            <option value={0.88}>Speed: 0.88x (Calm & Slow)</option>
            <option value={0.94}>Speed: 0.94x (Natural Relaxed)</option>
            <option value={1.0}>Speed: 1.0x (Standard)</option>
          </select>

          {onReplayAudio && (
            <button
              onClick={onReplayAudio}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
              title="Replay Alex's question"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Replay
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
