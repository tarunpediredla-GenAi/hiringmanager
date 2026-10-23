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

const ALEX_SYSTEM_INSTRUCTION = `You are Alex, an encouraging and professional technical interviewer conducting a mock interview for a Full Stack Python Developer with Gen AI.

Tone, Language & Clarity (CRITICAL FOR INDIAN CANDIDATES):
- Speak strictly in SIMPLE, BASIC, EVERYDAY ENGLISH that is very easy to listen to and understand.
- Use common, simple words and short, clear sentences (under 15 words per sentence).
- Avoid difficult western slang, complex idioms, or long complicated sentences.
- Speak with a warm, respectful, polite, and supportive tone so the candidate feels relaxed and confident.
- Pronounce technical terms simply and clearly (React, Django, SQL, PostgreSQL, Celery, Redis, Gen AI).

Interview Flow & Rules (STRICT):
1. One Simple Question at a Time: Ask only one clear, direct question per turn. Never combine multiple questions.
2. Short & Sweet: Keep your speech concise (1 to 2 short sentences per turn).
3. Warm Acknowledgement: Always begin by warmly acknowledging their answer (e.g., "Very nice explanation," "Yes, that makes good sense," or "Good point.").
4. Practical Questions: Ask practical, straightforward questions about how things work in real code (e.g., "How does your React component receive the streaming reply from Django?" or "How do you store user chats in your SQL database?").
5. Spoken Audio Delivery: Never use markdown bolding, asterisks, bullet points, or code blocks—speak entirely in clean, basic spoken English suitable to be read aloud calmly, slowly, and clearly.

Context & Target Skills:
Role: Full Stack Python Developer with Gen AI.
Skills: HTML, CSS, JavaScript, React, SQL, Django, and Generative AI.
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
                style: 'Simple, crystal clear everyday English, friendly, warm, and encouraging, spoken at a slow, calm, and relaxed pace with clean pronunciation so it is very easy to listen to and understand.',
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

    const evalPrompt = `You are a Lead Software Architect on the hiring committee reviewing this interview for: ${scenario || 'Full Stack Python Developer with Gen AI (HTML, CSS, JavaScript, React, SQL, Django, Gen AI)'}.

INTERVIEW TRANSCRIPT:
${conversationHistory}

WHITEBOARD / ARCHITECTURE NOTES:
${architectureContext || 'None provided'}

Provide a comprehensive hiring evaluation in JSON format with these exact keys:
{
  "hiringDecision": "Strong Hire" | "Hire" | "Lean Hire" | "Lean No Hire" | "No Hire",
  "overallScore": number (0 to 100),
  "executiveSummary": "A concise 2-3 sentence hiring committee summary of the candidate's performance across full-stack Python, Django, React, SQL, and Gen AI.",
  "dimensions": [
    {
      "name": "Frontend Engineering (HTML, CSS, JS, React)",
      "score": number (1 to 10),
      "feedback": "Specific feedback on React state, component architecture, hooks, and streaming UI."
    },
    {
      "name": "Backend Architecture (Python & Django)",
      "score": number (1 to 10),
      "feedback": "Specific feedback on Django REST Framework, API design, middleware, and async tasks."
    },
    {
      "name": "Database & SQL Data Modeling",
      "score": number (1 to 10),
      "feedback": "Specific feedback on SQL schemas, migrations, indexing, N+1 query optimization, and pgvector."
    },
    {
      "name": "Generative AI Integration & RAG Pipeline",
      "score": number (1 to 10),
      "feedback": "Feedback on LLM orchestration, embeddings, chunking, prompt engineering, and guardrails."
    },
    {
      "name": "Full Stack System Flow & Communication",
      "score": number (1 to 10),
      "feedback": "Feedback on end-to-end data flow, clear spoken trade-offs, and technical problem solving."
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
