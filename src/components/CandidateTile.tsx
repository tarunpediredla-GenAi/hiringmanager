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
  "In React, I use JavaScript fetch or axios to call Django REST API endpoints with GET and POST requests.",
  "In Django, I define models.py with SQL foreign keys and use Django ORM to query database records.",
  "For Gen AI, I call the Google Gemini API in Python Django and stream the response to the React frontend.",
  "I style the React UI using HTML5 and CSS so it is clean, fast, and fully responsive.",
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
  const [isVirtualCam, setIsVirtualCam] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualText, setManualText] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  // Sync webcam stream whenever video is toggled
  useEffect(() => {
    if (videoRef.current) {
      if (isVideoOn && !isVirtualCam && videoStreamRef.current) {
        videoRef.current.srcObject = videoStreamRef.current;
        videoRef.current.play().catch((e) => console.warn('Webcam playback error:', e));
      } else if (!isVideoOn && videoRef.current.srcObject) {
        videoRef.current.srcObject = null;
      }
    }
  }, [isVideoOn, isVirtualCam]);

  // Toggle candidate webcam
  const toggleCamera = async () => {
    setCameraError(null);
    if (isVideoOn) {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
        videoStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsVideoOn(false);
      setIsVirtualCam(false);
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Webcam API is not supported in this browser context. You can use Demo Face Preview.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });
        videoStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (e) {
            console.warn('Video play error:', e);
          }
        }
        setIsVirtualCam(false);
        setIsVideoOn(true);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Camera access error';
        console.warn('Unable to access webcam:', errorMsg);
        setCameraError(
          errorMsg.includes('Permission') || errorMsg.includes('NotAllowedError')
            ? 'Camera permission was denied in your browser. Click the lock/camera icon in your address bar to allow, or click Use Demo Face.'
            : `${errorMsg}. You can switch to Demo Face preview below.`
        );
      }
    }
  };

  const enableVirtualCam = () => {
    setCameraError(null);
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVirtualCam(true);
    setIsVideoOn(true);
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
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-6 h-full min-h-[380px]">
      {/* Background ambient glow effect responding to listening/speaking */}
      <div
        className="pointer-events-none absolute -inset-10 opacity-30 transition-all duration-300 blur-3xl"
        style={{
          background: isListening
            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)'
            : isThinking
            ? 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Top Header inside candidate tile */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 font-semibold text-xs shadow-inner backdrop-blur-sm">
            You
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-100 text-sm tracking-wide">Candidate (You)</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
                Candidate
              </span>
            </div>
            <p className="text-xs text-slate-400">Full Stack Python & Gen AI (HTML, CSS, JS, React, SQL, Django)</p>
          </div>
        </div>

        {/* Camera toggle & mode badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCamera}
            className={`px-2.5 py-1.5 rounded-lg border text-xs transition flex items-center gap-1.5 cursor-pointer ${
              isVideoOn
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 hover:bg-indigo-600/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoOn ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
            <span className="text-[11px] font-medium">{isVideoOn ? 'Webcam On' : 'Turn On Cam'}</span>
          </button>

          <button
            onClick={onToggleAutoSend}
            className={`px-2 py-1.5 rounded-lg border text-[11px] transition flex items-center gap-1 cursor-pointer ${
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

      {/* Center: Candidate Video Frame & Clear Live Subtitle Box (NO WORDS OVER FACE) */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2">
        {/* Permission warning banner if blocked */}
        {hasMicPermission === false && (
          <div className="mb-3 w-full p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/50 flex items-center justify-between gap-2 text-xs text-amber-200">
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

        {/* Camera error banner if permissions blocked */}
        {cameraError && (
          <div className="mb-3 w-full p-2.5 rounded-xl bg-rose-950/70 border border-rose-600/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-rose-200">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span className="text-[11px] leading-tight">{cameraError}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={enableVirtualCam}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] shadow-sm cursor-pointer"
              >
                Use Demo Face
              </button>
              <button
                onClick={() => setCameraError(null)}
                className="text-rose-400 hover:text-white px-1.5 py-0.5 rounded text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Dedicated Candidate Video Frame - Matching Alex's Frame Size & Style */}
        <div className="relative">
          {/* Active Speaking Ring when candidate is talking or mic is active */}
          {isListening && (
            <>
              <div
                className="absolute inset-0 rounded-3xl border-2 border-emerald-400/50 animate-ping duration-1000"
                style={{ transform: `scale(${1 + micVolume * 0.005})` }}
              />
              <div
                className="absolute -inset-2.5 rounded-3xl border border-emerald-400/30 transition-all duration-150"
                style={{ transform: `scale(${1 + micVolume * 0.003})` }}
              />
            </>
          )}

          <div
            className={`relative w-48 h-48 sm:w-56 sm:h-56 md:w-60 md:h-60 rounded-3xl overflow-hidden border-2 transition-all duration-300 shadow-2xl bg-slate-950 ${
              isListening
                ? 'border-emerald-400 ring-4 ring-emerald-500/50 shadow-emerald-500/40'
                : isVideoOn
                ? 'border-indigo-400 ring-2 ring-indigo-500/30'
                : 'border-slate-800'
            }`}
          >
            {/* Real Webcam Video Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                isVideoOn && !isVirtualCam ? 'opacity-100 block' : 'opacity-0 hidden'
              }`}
            />

            {/* Demo/Virtual Candidate Video Portrait */}
            {isVideoOn && isVirtualCam && (
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
                alt="Candidate Camera Feed"
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            )}

            {/* When Camera is OFF: Clean Video Conference Placeholder with One-Click Turn On */}
            {!isVideoOn && (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-900 to-slate-950 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 mb-2.5">
                  <VideoOff className="h-6 w-6 text-slate-500" />
                </div>
                <p className="text-xs text-slate-300 font-semibold mb-2">Camera is Off</p>
                <div className="flex flex-col gap-1.5 w-full max-w-[140px]">
                  <button
                    onClick={toggleCamera}
                    className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Video className="h-3 w-3" />
                    Turn On Cam
                  </button>
                  <button
                    onClick={enableVirtualCam}
                    className="w-full py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition cursor-pointer"
                  >
                    Demo Face
                  </button>
                </div>
              </div>
            )}

            {/* Top Left: Video Status Tag */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-[10px] text-slate-200 font-medium shadow-md">
              <span
                className={`h-2 w-2 rounded-full ${
                  isListening
                    ? 'bg-emerald-400 animate-ping'
                    : isVideoOn
                    ? 'bg-emerald-400'
                    : 'bg-slate-500'
                }`}
              />
              <span>{isVideoOn ? 'Candidate (Live)' : 'Candidate (Cam Off)'}</span>
            </div>

            {/* Top Right: HD Live Tag */}
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-950/70 backdrop-blur-md border border-slate-800 text-[9px] font-mono font-bold text-slate-300">
              {isVideoOn ? 'HD 1080p' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Live Decibel Visualizer Meter below video frame */}
        <div className="flex items-center gap-1 h-3 mt-3 mb-1">
          {[...Array(16)].map((_, i) => {
            const threshold = (i / 16) * 100;
            const active = micVolume > threshold;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${
                  active ? (i > 12 ? 'bg-amber-400 h-3' : 'bg-emerald-400 h-2.5') : 'bg-slate-800 h-1'
                }`}
              />
            );
          })}
        </div>

        {/* Live Speech Recognition & Transcript Caption Box (BELOW VIDEO - NEVER OVER FACE) */}
        <div className="mt-1 max-w-lg w-full text-center px-4">
          <div className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 text-center min-h-[46px] flex items-center justify-center shadow-md">
            {isTranscribing ? (
              <p className="text-amber-300 text-xs flex items-center gap-1.5 font-mono">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Transcribing your answer...
              </p>
            ) : interimTranscript ? (
              <p className="text-slate-100 text-xs sm:text-sm font-medium leading-relaxed italic">
                "{interimTranscript}"
              </p>
            ) : isListening ? (
              <p className="text-emerald-400 text-xs flex items-center gap-1.5 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                Listening to you... Speak your answer now
              </p>
            ) : isThinking ? (
              <p className="text-amber-400 text-xs font-mono flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 animate-spin text-amber-400" />
                Gemini AI is checking and evaluating your answer...
              </p>
            ) : isAlexSpeaking ? (
              <p className="text-indigo-300 text-xs font-mono">Alex (Gemini AI) is speaking. Listen or prepare your answer.</p>
            ) : (
              <p className="text-slate-400 text-xs">
                Speak or type your answer. Gemini AI will evaluate accuracy and correct any mistake in real-time.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom controls: Mic Button + Manual Text Input + Quick Prompts */}
      <div className="relative z-10 flex flex-col gap-2.5 pt-3 border-t border-slate-800/80">
        {/* Quick starter suggestions for Full Stack Python with Gen AI */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-400 scrollbar-none">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 shrink-0 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5 text-indigo-400" /> Quick Reply:
          </span>
          {QUICK_STARTERS.map((starter, i) => (
            <button
              key={i}
              onClick={() => handleQuickStarter(starter)}
              disabled={isThinking}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition text-[11px] truncate max-w-[210px] cursor-pointer"
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
                className="flex items-center justify-center gap-1.5 bg-rose-600/80 hover:bg-rose-600 text-white font-medium py-2 px-3 rounded-xl text-xs transition cursor-pointer"
              >
                <MicOff className="h-3.5 w-3.5" />
                Cancel
              </button>
              <button
                onClick={onSubmitSpeech}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                Submit Spoken Answer
              </button>
            </>
          ) : (
            <button
              onClick={onStartListening}
              disabled={isThinking}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-xs md:text-sm transition shadow-lg shadow-indigo-600/20 active:scale-98 cursor-pointer"
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
            placeholder="Or type candidate response here (HTML, CSS, React, Django, SQL, Gen AI)..."
            disabled={isThinking}
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal"
          />
          <button
            type="submit"
            disabled={!manualText.trim() || isThinking}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-700 transition cursor-pointer"
          >
            <Send className="h-3 w-3" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
