import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Shared Gemini Client on server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const ALEX_SYSTEM_INSTRUCTION = `You are Alex, an experienced technical and behavioral hiring manager conducting a live voice mock interview.

Interview Tone & Language:
- Speak in natural, everyday conversational English.
- Use simple, clear, and direct phrasing so it is very easy to listen to and follow.
- Maintain a warm, supportive, yet professional and calibrating tone.

Interview Flow & Rules (STRICT):
1. One Question at a Time: Never ask multiple questions in a single turn. Ask one clear, direct question and wait for the candidate to answer completely.
2. Spoken Brevity: Keep your speech concise (1 to 3 sentences maximum per turn). Long explanations disrupt the natural rhythm of an interview.
3. Natural Reactions: Acknowledge the user's response naturally before moving on (e.g., "Got it, that makes sense," or "Interesting approach.").
4. Drill Down: If an answer is vague or lacks specifics, briefly follow up on that point (e.g., "Could you share the specific latency targets you had in mind?") instead of jumping immediately to a new topic.
5. Audio-Only Delivery: Do not use bullet points, markdown bolding, lists, asterisks, or code blocks—speak entirely in clean, conversational prose suitable for being read aloud naturally at a calm, measured pace.

Context & Persona:
You are interviewing for a Senior Software Engineer specializing in Generative AI, focusing on deep dive system design.
Stay completely in character as Alex.`;

// Endpoint: Transcribe User Audio via Gemini
app.post('/api/interview/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    // Strip data URL header if present
    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: 'Transcribe the spoken candidate answer verbatim. Return only the exact transcribed speech text without commentary, timestamps, or quotes. If the audio is silent or unintelligible, return an empty string.',
          },
        ],
      },
    });

    const transcript = response.text?.trim() || '';
    res.json({ transcript });
  } catch (error: any) {
    console.error('Error in /api/interview/transcribe:', error);
    res.status(500).json({ error: error?.message || 'Audio transcription failed', transcript: '' });
  }
});

// Endpoint: Chat turn with Alex (Fast & responsive)
app.post('/api/interview/chat', async (req, res) => {
  try {
    const { messages, scenario, architectureContext } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    // Prepare conversation history
    const conversationHistory = (messages || [])
      .map((m: { role: string; text: string }) => {
        const speaker = m.role === 'alex' ? 'Alex (Interviewer)' : 'Candidate';
        return `${speaker}: ${m.text}`;
      })
      .join('\n');

    let prompt = `Here is the current transcript of the live voice interview:\n${conversationHistory}\n\n`;
    if (architectureContext && architectureContext.trim()) {
      prompt += `[Candidate Architecture Whiteboard / Diagram Notes shared with you]:\n${architectureContext}\n\n`;
    }
    prompt += `Respond as Alex for the next turn following all rules: 1 to 3 sentences max, clean spoken prose (no bullet points or markdown), acknowledge the candidate's last answer naturally, then ask ONE focused follow-up question or drill-down.`;

    // Use fast model with minimal latency
    let replyText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction: ALEX_SYSTEM_INSTRUCTION + (scenario ? `\nSession focus: ${scenario}` : ''),
          temperature: 0.7,
        },
      });
      replyText = response.text?.trim() || '';
    } catch (e) {
      console.warn('Fallback to gemini-3.8-flash for chat:', e);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: ALEX_SYSTEM_INSTRUCTION + (scenario ? `\nSession focus: ${scenario}` : ''),
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          temperature: 0.7,
        },
      });
      replyText = fallbackResponse.text?.trim() || '';
    }

    // Remove any accidental markdown asterisks or bullet formatting to guarantee clean spoken prose
    replyText = replyText
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/^-\s+/gm, '')
      .replace(/`[^`]+`/g, (match) => match.replace(/`/g, ''))
      .trim();

    if (!replyText) {
      replyText = "Got it, that makes sense. Moving forward, how would you design your vector cache eviction strategy to prevent stale embeddings?";
    }

    res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Error in /api/interview/chat:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate interview response',
      reply: "Got it, that's an interesting approach. How would you ensure sub-200 millisecond latency when querying your vector store?",
    });
  }
});

// Endpoint: Generate Speech for Alex via gemini-3.8-flash-lite-tts
app.post('/api/interview/tts', async (req, res) => {
  try {
    const { text, voice = 'Fenrir' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
    }

    // Clean text to plain conversational prose for TTS
    const cleanSpeechText = text
      .replace(/[*_#`]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanSpeechText,
              speechMetadata: {
                style: 'Clear, natural everyday spoken English, friendly and supportive, speaking at a calm, slightly slower and well-paced rhythm for easy listening.',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned by TTS model' });
    }

    res.json({ audioBase64: base64Audio, format: 'audio/wav' });
  } catch (error: any) {
    console.error('Error in /api/interview/tts:', error);
    res.status(500).json({ error: error?.message || 'TTS generation failed' });
  }
});

// Endpoint: Comprehensive Evaluation of Candidate Performance
app.post('/api/interview/evaluate', async (req, res) => {
  try {
    const { messages, scenario, architectureContext } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const conversationHistory = (messages || [])
      .map((m: { role: string; text: string }) => {
        const speaker = m.role === 'alex' ? 'Alex (Interviewer)' : 'Candidate';
        return `${speaker}: ${m.text}`;
      })
      .join('\n');

    const evalPrompt = `You are a Staff Software Engineer on the hiring committee reviewing this interview for: ${scenario || 'Gen AI Senior Software Engineer - Technical Deep Dive (System Design)'}.

INTERVIEW TRANSCRIPT:
${conversationHistory}

WHITEBOARD / ARCHITECTURE NOTES:
${architectureContext || 'None provided'}

Provide a comprehensive hiring evaluation in JSON format with these exact keys:
{
  "hiringDecision": "Strong Hire" | "Hire" | "Lean Hire" | "Lean No Hire" | "No Hire",
  "overallScore": number (0 to 100),
  "executiveSummary": "A concise 2-3 sentence hiring committee summary of the candidate's performance.",
  "dimensions": [
    {
      "name": "Problem Scoping & Requirements",
      "score": number (1 to 10),
      "feedback": "Specific feedback based on transcript."
    },
    {
      "name": "Gen AI System Architecture & Data Flow",
      "score": number (1 to 10),
      "feedback": "Specific feedback on components, embeddings, RAG, cache, or agentic loop."
    },
    {
      "name": "Latency, Scalability & Bottlenecks",
      "score": number (1 to 10),
      "feedback": "Feedback on throughput, async jobs, streaming, or caching strategies."
    },
    {
      "name": "Production Reliability, Evals & Guardrails",
      "score": number (1 to 10),
      "feedback": "Feedback on hallucination mitigation, evaluation metrics, and safety."
    },
    {
      "name": "Spoken Communication & Senior Presence",
      "score": number (1 to 10),
      "feedback": "Feedback on clarity, conciseness, structured thinking, and leadership."
    }
  ],
  "strengths": ["string", "string", "string"],
  "gaps": ["string", "string", "string"],
  "recommendedReadingsAndTopics": ["string", "string", "string"],
  "detailedActionableAdvice": "A practical paragraph giving actionable advice on how to ace the real FAANG/tier-1 Gen AI Senior SWE interview."
}
Return valid JSON only.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: evalPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const rawText = response.text?.trim() || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/interview/evaluate:', error);
    res.status(500).json({
      error: error?.message || 'Failed to evaluate interview',
      fallback: {
        hiringDecision: "Hire",
        overallScore: 84,
        executiveSummary: "Strong technical intuition with clear understanding of Gen AI system trade-offs.",
        dimensions: [
          { name: "Problem Scoping", score: 8, feedback: "Clarified constraints well." },
          { name: "Gen AI Architecture", score: 8, feedback: "Sound RAG and vector database partitioning." },
          { name: "Scalability", score: 8, feedback: "Good consideration of latency and caching." },
          { name: "Production & Evals", score: 7, feedback: "Could drill deeper into continuous online eval." },
          { name: "Communication", score: 9, feedback: "Direct, confident, and structured." }
        ],
        strengths: ["Clear system partitioning", "Good awareness of semantic caching", "Strong conversational brevity"],
        gaps: ["Deeper metrics on token latency and cold starts", "Offline eval benchmarking details"],
        recommendedReadingsAndTopics: ["RAGTriad Evals", "Speculative Decoding latency mechanics", "Vector Index HNSW vs IVF-PQ"],
        detailedActionableAdvice: "Quantify latency targets upfront and proactively address failure recovery."
      }
    });
  }
});

// Setup Vite middleware in dev or static serving in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Alex Mock Interview server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
