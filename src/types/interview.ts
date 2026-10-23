export type Role = 'alex' | 'candidate';

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  timestamp: string;
  audioUrl?: string;
  isStreaming?: boolean;
  isCorrection?: boolean;
}

export interface WhiteboardNode {
  id: string;
  label: string;
  category: 'ingestion' | 'storage' | 'compute' | 'cache' | 'eval';
  description?: string;
  x: number;
  y: number;
}

export interface WhiteboardConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface EvaluationDimension {
  name: string;
  score: number; // 1-10
  feedback: string;
}

export interface EvaluationResult {
  hiringDecision: 'Strong Hire' | 'Hire' | 'Lean Hire' | 'Lean No Hire' | 'No Hire';
  overallScore: number; // 0-100
  executiveSummary: string;
  dimensions: EvaluationDimension[];
  strengths: string[];
  gaps: string[];
  recommendedReadingsAndTopics: string[];
  detailedActionableAdvice: string;
}

export type InterviewStatus = 'idle' | 'speaking' | 'listening' | 'thinking' | 'evaluating' | 'concluded';

export type LayoutMode = 'call' | 'split' | 'whiteboard';

export interface InterviewScenario {
  id: string;
  title: string;
  role: string;
  focus: string;
  description: string;
  initialAlexKickoff: string;
  initialCandidateResponse: string;
  firstQuestion: string;
}
