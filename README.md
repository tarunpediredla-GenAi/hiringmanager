# 🎙️ Alex: Full Stack Python Developer & Gen AI Mock Interviewer

> **Live, voice-first AI technical & architecture hiring manager conducting interactive mock interviews for Full Stack Python Developers with Gen AI across HTML, CSS, JavaScript, React, SQL, Django, and LLM pipelines.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.0-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![SQL](https://img.shields.io/badge/SQL-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)

---

## 🌟 Overview

**Alex** is an executive-level technical hiring manager and tech lead designed to simulate high-stakes interviews for **Full Stack Python Developers with Gen AI**.

Alex evaluates candidates across the full end-to-end modern stack:
- **Frontend**: HTML5, CSS3, modern JavaScript, and React (state management, hooks, Server-Sent Events for streaming tokens).
- **Backend & APIs**: Python with Django and Django REST Framework (DRF), Celery asynchronous workers, and Redis task queues.
- **Data & SQL**: Relational database architecture (PostgreSQL), schema migrations, query optimization (N+1 query elimination), and pgvector for semantic vector embeddings.
- **Generative AI**: LLM orchestration, embedding generation, RAG document pipelines, prompt guardrails, and real-time streaming inference.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Candidate Browser Client                        │
│                                                                        │
│   ┌─────────────────────┐   ┌───────────────────┐   ┌──────────────┐   │
│   │  Candidate WebCam   │   │  Interviewer Tile │   │ Architecture │   │
│   │   & Audio Visual    │   │  (Alex's Avatar)  │   │  Whiteboard  │   │
│   └──────────┬──────────┘   └─────────▲─────────┘   └──────┬───────┘   │
│              │ Mic Stream             │ Audio / WAV        │ Node Sync │
└──────────────┼────────────────────────┼────────────────────┼───────────┘
               │                        │                    │
               │ HTTP / JSON Payload    │                    │
               ▼                        │                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Full-Stack Express & Vite Server                     │
│                                                                        │
│  • POST /api/interview/chat        -> Generates next conversational    │
│                                       turn with spoken brevity & drill │
│  • POST /api/interview/transcribe  -> Fallback raw audio transcription │
│  • POST /api/interview/tts         -> High-definition voice synthesis  │
│  • POST /api/interview/evaluate    -> Calibrated Hiring Committee debrief│
└──────────────────────────────────────┬─────────────────────────────────┘
                                       │ Google GenAI SDK
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Google Gemini Foundation Models                   │
│                                                                        │
│  • gemini-3.1-flash-lite / 3.8-flash: Conversational Interviewer Logic │
│  • gemini-3.8-flash-lite-tts: High-Def Spoken Voice Synthesis          │
│  • gemini-3.5-transcribe: Raw Audio Speech-to-Text Transcription       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 1. 🗣️ True Voice-First Interaction
- **One Question at a Time**: Never overwhelms the candidate with multi-part questions.
- **Natural Reactions**: Naturally acknowledges candidate points (*"Got it, that makes sense"*, *"Interesting approach on caching"*) before drilling down.
- **Technical Drill-Downs**: Detects hand-wavy or vague answers and asks specific follow-up questions on metrics, latency SLAs, chunking sizes, and cache invalidation.
- **Speaking Speed Control**: Configurable speech rate slider (0.75x to 1.1x) with 0.88x recommended for calm, natural pacing.
- **Multi-Voice Persona**: Select between *Fenrir* (Authoritative/Senior), *Puck* (Warm/Conversational), *Zephyr* (Crisp/Direct), and *Kore* (Clear/Articulate).

### 2. 🎙️ Dual-Channel Speech Recognition
- **Real-Time Web Speech API**: Streams live interim words onto your screen as you speak.
- **MediaRecorder + Gemini Transcription**: Automatically captures audio chunks and sends them to `/api/interview/transcribe` if the browser blocks client-side speech recognition.
- **Push-to-Talk or Auto-Send**: Choose manual push-to-talk or auto-send on silence detection.
- **Direct Text Input & Quick Starters**: Type answers or test candidate turns with 1-click preset answers.

### 3. 📐 Interactive Gen AI System Design Whiteboard
- Add pre-configured enterprise Gen AI building blocks:
  - **API Gateway & Rate Limiter** (2,500 RPS)
  - **Semantic Cache (Redis)** (Cosine similarity threshold > 0.94)
  - **Ingestion & Chunking Pipeline** (Hierarchical 512-token markdown chunking)
  - **Embedding Service (Batch GPU)**
  - **Vector DB (Milvus / Pinecone HNSW M=16)**
  - **Hybrid Search & Cross-Encoder Reranker**
  - **LLM Serving Cluster (vLLM / Speculative Decoding)**
  - **Prompt Guardrails & Safety Filter**
  - **Evaluation & Telemetry (RAGTriad, Langfuse, OpenTelemetry)**
- **"Share with Alex" Button**: Synchronizes your architecture components and calculations into Alex's reasoning loop for tailored drill-downs.

### 4. 📊 Calibrated Hiring Committee Scorecard
- **Overall Hiring Recommendation**: *Strong Hire*, *Hire*, *Lean Hire*, *Lean No Hire*, or *No Hire*.
- **0–100 Overall Score** with executive hiring committee summary.
- **5 Core Dimensional Scores (1–10)**:
  1. *Problem Scoping & Requirements*
  2. *Gen AI System Architecture & Data Flow*
  3. *Latency, Scalability & Bottlenecks*
  4. *Production Reliability, Evals & Guardrails*
  5. *Spoken Communication & Senior Presence*
- **Specific Strengths & Critical Gaps**.
- **Recommended Readings & Topics** (e.g., *HNSW vs IVF-PQ*, *RAGTriad Evals*, *Speculative Decoding Mechanics*).
- **Export Debrief**: Download a full interview report as `.txt` for offline study.

### 5. 💡 System Design Tips & Playbook (Floating Action Button)
- **Floating Action Button (FAB)**: Quick-access floating trigger in the bottom corner of the screen.
- **The 4-Step Staff SWE Formula**: Structured pacing guide (*5m Scoping → 10m High-Level Flow → 15m Deep Dive → 5m Resilience*).
- **Golden Clarifying Questions**: High-impact questions to ask Alex (*Scale, Peak QPS, Latency SLA / P99 TTFT, Index Freshness, Multi-tenancy Isolation*). Includes 1-click **"Ask Alex Now"** injection and copy-to-clipboard.
- **Sizing & SLA Cheat Sheet**: Real-world back-of-the-envelope calculations for token economics, vector memory footprint, and ANN search latencies.
- **Common Pitfalls & Traps**: Side-by-side examples of fatal interview mistakes versus senior engineering approaches.

### 6. 🔥 Firebase Authentication & Cloud Firestore Persistence
- **Google Sign-In**: Quick 1-click Google authentication via popup.
- **Cloud Firestore Persistence**: Save and archive completed mock interview transcripts, whiteboard diagrams, and scorecards to your personal account.
- **"Past Interviews" History Drawer**: Revisit past interviews, track score progression over time, reload previous architecture diagrams, and review Alex's detailed feedback.
- **Zero-Trust Security Rules**: Strict attribute-based access control (ABAC) in `firestore.rules` guaranteeing isolated candidate access.

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- A free [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/alex-voice-mock-interviewer.git
cd alex-voice-mock-interviewer
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Open `.env` and add your Gemini API Key:
```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
PORT=3000
```

### 4. Start the Full-Stack Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🛠️ Project Structure

```
alex-voice-mock-interviewer/
├── .env.example                 # Sample environment variables
├── index.html                   # HTML entry point with meta tags & Google fonts
├── metadata.json                # Project capabilities & permissions
├── package.json                 # Dependencies and build scripts
├── server.ts                    # Full-Stack Express server & Gemini backend API
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration with Tailwind CSS plugin
├── src/
│   ├── App.tsx                  # Main layout orchestrator & session coordinator
│   ├── main.tsx                 # React application root entry point
│   ├── index.css                # Global styles & Tailwind CSS imports
│   ├── types/
│   │   └── interview.ts         # TypeScript definitions for messages, nodes & evals
│   ├── services/
│   │   └── api.ts               # Client API wrapper for chat, TTS, transcribe, evals
│   ├── hooks/
│   │   └── useVoice.ts          # Web Audio volume analyser, Web Speech API & TTS hook
│   └── components/
│       ├── InterviewerTile.tsx  # Alex video tile, wave visualizer & speed control
│       ├── CandidateTile.tsx    # Candidate webcam, mic decibel meter & quick replies
│       ├── Whiteboard.tsx       # System design architecture diagram & notes pad
│       ├── TranscriptDrawer.tsx # Full chronological transcript with audio replay
│       ├── EvaluationModal.tsx  # Calibrated Hiring Committee debrief modal
│       └── SettingsModal.tsx    # Voice selection, speaking rate & scenario picker
```

---

## 🔌 API Reference

### `POST /api/interview/chat`
Generates Alex's next spoken conversational turn.
```json
{
  "messages": [
    { "role": "alex", "text": "What role are you targeting today?" },
    { "role": "candidate", "text": "I am preparing for a Gen AI Senior SWE role." }
  ],
  "scenario": "Gen AI Senior SWE: System Design Deep Dive",
  "architectureContext": "Components: [Vector DB (HNSW Index)]..."
}
```
**Response:**
```json
{
  "reply": "Awesome, let's dive into system design. Suppose we are building a multi-tenant enterprise RAG platform..."
}
```

### `POST /api/interview/tts`
Generates natural audio via `gemini-3.8-flash-lite-tts`.
```json
{
  "text": "Got it, that makes sense.",
  "voice": "Fenrir"
}
```
**Response:**
```json
{
  "audioBase64": "UklGR...",
  "format": "audio/wav"
}
```

### `POST /api/interview/transcribe`
Transcribes raw candidate voice audio via `gemini-3.5-transcribe`.
```json
{
  "audioBase64": "<base64-encoded-audio>",
  "mimeType": "audio/webm"
}
```
**Response:**
```json
{
  "transcript": "I would partition the vector index by tenant ID and cache queries in Redis."
}
```

### `POST /api/interview/evaluate`
Generates a comprehensive hiring committee scorecard.
```json
{
  "messages": [...],
  "scenario": "Gen AI Senior SWE",
  "architectureContext": "..."
}
```
**Response:** Returns `EvaluationResult` with `hiringDecision`, `overallScore`, `dimensions`, `strengths`, and `gaps`.

---

## 🎯 Practice Scenarios Included

1. **Gen AI Senior SWE: System Design Deep Dive** (Default)
   - Multi-tenant enterprise RAG, vector indexes, semantic caching, token economics, and low-latency serving.
2. **Gen AI Senior SWE: Agentic Systems & Tool Calling**
   - Autonomous multi-agent loops, state management, cyclic failure recovery, and guardrails.
3. **Gen AI Senior SWE: Model Serving & Latency Optimization**
   - Continuous batching, vLLM / TensorRT, speculative decoding, KV-cache paging, and GPU cluster scaling.
4. **Senior SWE Behavioral: Tech Leadership & Trade-offs**
   - Resolving architecture deadlocks, critical production incident triage, and cross-functional influence.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👤 Author

Developed for engineers and tech leads preparing for top-tier Generative AI and Systems architecture interviews.

*Star ⭐ this repository on GitHub if you found it helpful for your interview prep!*
