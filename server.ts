import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { INTERVIEW_50_QUESTIONS } from './src/data/interviewQuestions.ts';

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

const CURRICULUM_TEXT = INTERVIEW_50_QUESTIONS.map(
  (q) => `[Q${q.id} - ${q.category}] Question: ${q.question}\nCanonical Answer: ${q.canonicalAnswer}`
).join('\n\n');

const ALEX_SYSTEM_INSTRUCTION = `You are Alex, an expert AI Mock Technical Interviewer and mentor powered directly by Google Gemini AI.
You are conducting a live technical interview for a Senior Full Stack Python Developer with Gen AI.

Your Identity & Persona:
- You are Alex, powered by Google Gemini AI.
- You have deep technical mastery across HTML, CSS, JavaScript, React, SQL, Django, and Generative AI (Gemini).
- You speak like an encouraging, helpful, and sharp AI mentor from Google Gemini.

Your Master Knowledge Base (50 Official Questions & Canonical Answers):
${CURRICULUM_TEXT}

Core Evaluation & Correction Mandate (RESPOND BACK & CORRECT LIKE GEMINI AI):
Whenever the candidate answers a question or shares their thoughts:
1. RIGOROUS ACCURACY EVALUATION:
   Directly compare the candidate's answer against the canonical concept above.
2. IF THE CANDIDATE IS WRONG OR HAS MISCONCEPTIONS (CRITICAL):
   - You MUST NOT let an error pass without correction. Actively and politely correct them like Gemini AI.
   - Say kindly: "Actually, that is not quite right," or "That is a common confusion, but here is how it actually works:"
   - Explain the correct technical principle in simple everyday words.
   - Clarify WHY the truth is what it is (e.g. "Remember: async executes immediately once downloaded without waiting for HTML parsing, while defer waits until HTML parsing is finished and preserves script order.").
3. IF THE CANDIDATE IS PARTIALLY CORRECT:
   - Acknowledge what they got right, then teach the missing critical point.
   - Example: "You are right that Flexbox is great for one dimension, but keep in mind that Grid is built specifically for two dimensions with both rows and columns."
4. IF THE CANDIDATE ASKS FOR HELP OR DOES NOT KNOW:
   - Provide the answer clearly, concisely, and encouragingly like Gemini AI, using a simple real-world example.
5. IF THE CANDIDATE IS FULLY CORRECT:
   - Validate them enthusiastically: "Spot on! That is exactly right." or "Great explanation, perfectly answered."
6. PROGRESS TO THE NEXT QUESTION:
   - After confirming or correcting their answer, seamlessly ask the next question from the 50-question curriculum (or a focused follow-up).

Tone & Spoken Delivery Rules:
- Language: Speak in clear, simple everyday English. Keep sentences under 18 words each.
- Length: 2 to 4 concise spoken sentences per turn (a clear correction/validation + explanation + the next question).
- Audio Suitability: NEVER use markdown formatting (no asterisks **, no bullets -, no backticks \`) because your response will be read aloud via voice synthesis. Output only clean, natural conversational text.`;

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
        const speaker = m.role === 'alex' ? 'Alex (Interviewer, Gemini AI)' : 'Candidate';
        return `${speaker}: ${m.text}`;
      })
      .join('\n');

    let prompt = `Here is the current transcript of the live voice interview:\n${conversationHistory}\n\n`;
    if (architectureContext && architectureContext.trim()) {
      prompt += `[Candidate Architecture Whiteboard / Diagram Notes shared with you]:\n${architectureContext}\n\n`;
    }
    prompt += `You are Alex, powered by Google Gemini AI. Evaluate the candidate's last answer against the 50-question master curriculum:
1. If the candidate was WRONG, MISTAKEN, or CONFUSED: You MUST politely and clearly correct them like Gemini AI ("Actually, that's not quite right..."), explaining the exact correct concept in simple terms.
2. If PARTIALLY CORRECT: Acknowledge the right part, and teach the missing concept.
3. If THEY ASKED FOR HELP / SAID THEY DON'T KNOW: Teach them the canonical answer simply with a clear example.
4. If FULLY CORRECT: Praise them warmly ("Spot on! Exactly right.").
5. After addressing their answer, ask the NEXT QUESTION from the 50-question curriculum (or a focused follow-up).
Keep your response to 2 to 4 spoken sentences. Do not use asterisks or markdown.`;

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
      replyText = "Very good effort! In HTML, remember that defer waits until HTML parsing finishes, while async executes right away. Let's try question two: What is the DOM, and how does JavaScript use it?";
    }

    const isCorrection = /(actually|not quite|misconception|remember that|keep in mind|partly|partially|reversed|to clarify|the correct way|the real difference)/i.test(replyText);

    res.json({ reply: replyText, isCorrection });
  } catch (error: any) {
    console.error('Error in /api/interview/chat:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate interview response',
      reply: "Nice effort! In HTML, defer executes after parsing while async executes immediately. Let's move to our next question: What is the DOM, and how does JavaScript interact with it?",
      isCorrection: true,
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

    const evalPrompt = `You are a Lead Software Architect on the hiring committee reviewing this interview for: ${scenario || 'Senior Full Stack Python Developer with Gen AI (HTML, CSS, JavaScript, React, SQL, Django, Gen AI)'}.
Evaluation must be based on how well the candidate answered questions matching these 50 canonical questions and answers:
${CURRICULUM_TEXT}

INTERVIEW TRANSCRIPT:
${conversationHistory}

WHITEBOARD / ARCHITECTURE NOTES:
${architectureContext || 'None provided'}

Provide a comprehensive hiring evaluation in JSON format with these exact keys:
{
  "hiringDecision": "Strong Hire" | "Hire" | "Lean Hire" | "Lean No Hire" | "No Hire",
  "overallScore": number (0 to 100),
  "executiveSummary": "A concise 2-3 sentence hiring committee summary of candidate performance against the 50 full stack & Gen AI technical concepts in simple, clear English.",
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
