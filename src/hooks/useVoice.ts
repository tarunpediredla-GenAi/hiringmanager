import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchAlexTTS, transcribeAudio } from '../services/api';

// Web Speech API interfaces
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

interface UseVoiceOptions {
  onCandidateSpeechSubmit?: (transcript: string) => void;
  autoSendAfterSilenceMs?: number;
  voiceName?: string;
  initialSpeechRate?: number;
}

export function useVoice({
  onCandidateSpeechSubmit,
  autoSendAfterSilenceMs = 2200,
  voiceName = 'Fenrir',
  initialSpeechRate = 0.88,
}: UseVoiceOptions = {}) {
  // Speech Rate state (e.g. 0.85 = slower, 1.0 = normal)
  const [speechRate, setSpeechRate] = useState<number>(initialSpeechRate);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micVolume, setMicVolume] = useState(0);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Text to Speech (Alex) state
  const [isAlexSpeaking, setIsAlexSpeaking] = useState(false);
  const [alexAudioLevel, setAlexAudioLevel] = useState(0);

  // References
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const accumulatedTranscriptRef = useRef('');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const alexAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const alexAnimFrameRef = useRef<number | null>(null);

  // MediaRecorder for server-side Gemini audio transcription fallback
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedAudioChunksRef = useRef<Blob[]>([]);

  // Setup Microphone Stream and Analyser for visual volume meter
  const initMicAudio = useCallback(async (): Promise<MediaStream | null> => {
    try {
      if (micStreamRef.current && micStreamRef.current.active) {
        return micStreamRef.current;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      micStreamRef.current = stream;
      setHasMicPermission(true);
      setPermissionError(null);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((avg / 128) * 100));
          setMicVolume(normalized);
          animFrameRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();
      }

      return stream;
    } catch (err: any) {
      console.warn('Microphone permission or audio context error:', err);
      setHasMicPermission(false);
      setPermissionError(err.message || 'Microphone access denied. Please allow microphone permissions in your browser.');
      return null;
    }
  }, []);

  // Initialize Speech Recognition
  const initSpeechRecognition = useCallback(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      return null;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalChunk += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (finalChunk) {
          accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + finalChunk.trim();
        }

        const currentFull = (accumulatedTranscriptRef.current + (interim ? ' ' + interim : '')).trim();
        setInterimTranscript(currentFull);

        // Auto-submit on silence detection if enabled
        if (autoSendAfterSilenceMs > 0 && currentFull.length > 5) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            submitCurrentSpeech();
          }, autoSendAfterSilenceMs);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition event warning:', event.error);
        if (event.error === 'not-allowed') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Recognition ended
      };

      recognitionRef.current = recognition;
      return recognition;
    } catch (e) {
      console.warn('Failed to initialize SpeechRecognition:', e);
      return null;
    }
  }, [autoSendAfterSilenceMs]);

  // Start candidate listening (Both Web Speech API + MediaRecorder recording)
  const startListening = useCallback(async () => {
    stopAlexSpeaking();

    const stream = await initMicAudio();
    if (!stream) {
      console.warn('Cannot start listening without mic stream');
      return;
    }

    accumulatedTranscriptRef.current = '';
    setInterimTranscript('');
    setIsListening(true);

    // 1. Setup MediaRecorder for raw audio capture
    try {
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
      }

      recordedAudioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedAudioChunksRef.current.push(e.data);
        }
      };
      recorder.start(250); // Slice every 250ms
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.warn('MediaRecorder error:', err);
    }

    // 2. Setup Web Speech API for real-time text feedback
    if (!recognitionRef.current) {
      initSpeechRecognition();
    }

    try {
      recognitionRef.current?.start();
    } catch (e) {
      // Might already be running
    }
  }, [initMicAudio, initSpeechRecognition]);

  // Stop candidate listening
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      // ignore
    }

    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch (e) {
      // ignore
    }

    setIsListening(false);
  }, []);

  // Submit current spoken transcript (with Gemini audio transcription fallback)
  const submitCurrentSpeech = useCallback(async () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    let recognizedText = (accumulatedTranscriptRef.current + (interimTranscript ? ' ' + interimTranscript : '')).trim();

    stopListening();

    // If Web Speech API got text, send it immediately
    if (recognizedText && recognizedText.length >= 2) {
      accumulatedTranscriptRef.current = '';
      setInterimTranscript('');
      if (onCandidateSpeechSubmit) {
        onCandidateSpeechSubmit(recognizedText);
      }
      return recognizedText;
    }

    // If Web Speech API was silent/empty, check if we recorded audio chunks for server transcription
    if (recordedAudioChunksRef.current.length > 0) {
      setIsTranscribing(true);
      try {
        const audioBlob = new Blob(recordedAudioChunksRef.current, {
          type: mediaRecorderRef.current?.mimeType || 'audio/webm',
        });

        if (audioBlob.size > 1000) {
          const serverTranscript = await transcribeAudio(audioBlob);
          if (serverTranscript && serverTranscript.trim().length >= 2) {
            recognizedText = serverTranscript.trim();
            accumulatedTranscriptRef.current = '';
            setInterimTranscript('');
            if (onCandidateSpeechSubmit) {
              onCandidateSpeechSubmit(recognizedText);
            }
            setIsTranscribing(false);
            return recognizedText;
          }
        }
      } catch (err) {
        console.warn('Server audio transcription error:', err);
      } finally {
        setIsTranscribing(false);
      }
    }

    accumulatedTranscriptRef.current = '';
    setInterimTranscript('');
    return '';
  }, [interimTranscript, onCandidateSpeechSubmit, stopListening]);

  // Stop Alex speaking
  const stopAlexSpeaking = useCallback(() => {
    if (alexAudioElementRef.current) {
      alexAudioElementRef.current.pause();
      alexAudioElementRef.current.currentTime = 0;
      alexAudioElementRef.current = null;
    }
    if (alexAnimFrameRef.current) {
      cancelAnimationFrame(alexAnimFrameRef.current);
      alexAnimFrameRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsAlexSpeaking(false);
    setAlexAudioLevel(0);
  }, []);

  // Speak text as Alex (first tries Gemini TTS, falls back to Web Speech Synthesis)
  const speakAsAlex = useCallback(
    async (text: string, onEnded?: () => void) => {
      stopAlexSpeaking();
      setIsAlexSpeaking(true);

      const startWaveSimulation = () => {
        let angle = 0;
        const animate = () => {
          angle += 0.25;
          const level = Math.abs(Math.sin(angle) * 70) + Math.random() * 30;
          setAlexAudioLevel(Math.round(level));
          alexAnimFrameRef.current = requestAnimationFrame(animate);
        };
        alexAnimFrameRef.current = requestAnimationFrame(animate);
      };

      startWaveSimulation();

      try {
        // 1. Try Gemini 3.8 Flash Lite TTS on backend
        const audioUrl = await fetchAlexTTS(text, voiceName);
        const audio = new Audio(audioUrl);
        audio.playbackRate = speechRate; // Slightly slower, measured pace
        alexAudioElementRef.current = audio;

        audio.onended = () => {
          setIsAlexSpeaking(false);
          setAlexAudioLevel(0);
          if (alexAnimFrameRef.current) cancelAnimationFrame(alexAnimFrameRef.current);
          if (onEnded) onEnded();
        };

        audio.onerror = () => {
          fallbackToSpeechSynthesis(text, onEnded);
        };

        await audio.play();
      } catch (err) {
        fallbackToSpeechSynthesis(text, onEnded);
      }
    },
    [stopAlexSpeaking, voiceName, speechRate]
  );

  // Fallback to browser SpeechSynthesis
  const fallbackToSpeechSynthesis = (text: string, onEnded?: () => void) => {
    if (!('speechSynthesis' in window)) {
      setIsAlexSpeaking(false);
      setAlexAudioLevel(0);
      if (alexAnimFrameRef.current) cancelAnimationFrame(alexAnimFrameRef.current);
      if (onEnded) onEnded();
      return;
    }

    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechRate; // Slightly slower, relaxed pace
    utterance.pitch = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Alex') || v.name.includes('Daniel'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onend = () => {
      setIsAlexSpeaking(false);
      setAlexAudioLevel(0);
      if (alexAnimFrameRef.current) cancelAnimationFrame(alexAnimFrameRef.current);
      if (onEnded) onEnded();
    };

    utterance.onerror = () => {
      setIsAlexSpeaking(false);
      setAlexAudioLevel(0);
      if (alexAnimFrameRef.current) cancelAnimationFrame(alexAnimFrameRef.current);
      if (onEnded) onEnded();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (alexAnimFrameRef.current) cancelAnimationFrame(alexAnimFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (alexAudioElementRef.current) {
        alexAudioElementRef.current.pause();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
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
  };
}
