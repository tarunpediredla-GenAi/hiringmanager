import { ChatMessage, EvaluationResult } from '../types/interview';

export async function sendInterviewTurn(
  messages: ChatMessage[],
  scenario: string,
  architectureContext?: string
): Promise<{ reply: string }> {
  const payload = {
    messages: messages.map((m) => ({ role: m.role, text: m.text })),
    scenario,
    architectureContext,
  };

  const response = await fetch('/api/interview/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with ${response.status}`);
  }

  return response.json();
}

export async function fetchAlexTTS(text: string, voice: string = 'Fenrir'): Promise<string> {
  const response = await fetch('/api/interview/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });

  if (!response.ok) {
    throw new Error(`TTS failed with status ${response.status}`);
  }

  const data = await response.json();
  if (data.audioBase64) {
    return `data:audio/wav;base64,${data.audioBase64}`;
  }
  throw new Error('No audio returned in response');
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  // Convert blob to base64
  const arrayBuffer = await audioBlob.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  const base64 = btoa(binary);

  const response = await fetch('/api/interview/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: base64,
      mimeType: audioBlob.type || 'audio/webm',
    }),
  });

  if (!response.ok) {
    throw new Error('Server transcription failed');
  }

  const data = await response.json();
  return data.transcript || '';
}

export async function evaluateInterview(
  messages: ChatMessage[],
  scenario: string,
  architectureContext?: string
): Promise<EvaluationResult> {
  const payload = {
    messages: messages.map((m) => ({ role: m.role, text: m.text })),
    scenario,
    architectureContext,
  };

  const response = await fetch('/api/interview/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.fallback) {
      return errorData.fallback;
    }
    throw new Error(errorData.error || 'Evaluation failed');
  }

  const result = await response.json();
  return result;
}
