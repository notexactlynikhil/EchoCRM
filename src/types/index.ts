export type CallStatus = 'recording' | 'processing' | 'done';
export type TaskStatus = 'pending' | 'done';
export type DealStage = 'prospecting' | 'negotiation' | 'closing' | 'won' | 'lost';
export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  owner_id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  tags: string[];
  created_at: string;
}

export interface MeetingRecording {
  id: string;
  platform: string;
  meeting_url: string;
  started_at: string;
  stopped_at?: string;
  duration_seconds: number;
  mime_type: string;
  storage_path: string;
  status: string;
  customer_id?: string;
  customer?: { name: string };
  last_error?: string | null;
}

export interface Call {
  id: string;
  customer_id: string;
  owner_id: string;
  audio_url?: string;
  recording_id?: string | null;
  duration_seconds?: number;
  started_at: string;
  raw_transcript: any;
  clean_transcript?: any;
  status: CallStatus;
  created_at: string;
  customer?: { name: string };
}

export interface CallSummary {
  id: string;
  call_id: string;
  summary_text?: string;
  product?: string;
  deal_stage?: DealStage;
  sentiment?: SentimentType;
  created_at: string;
}

export interface Task {
  id: string;
  customer_id: string;
  call_id?: string;
  owner_id: string;
  description: string;
  due_date?: string;
  status: TaskStatus;
  created_at: string;
  customer?: { name: string };
}

export interface Deal {
  id: string;
  customer_id: string;
  owner_id: string;
  product: string;
  stage: DealStage;
  expected_close_date?: string;
  value: number;
  created_at: string;
  customer?: { name: string };
}

export interface AIAnalysisResult {
  summary: string;
  sentiment: SentimentType;
  deal_stage: DealStage;
  customer_intent: string;
  products_discussed: string[];
  action_items: Array<{
    description: string;
    due_date: string | null;
  }>;
  follow_up: {
    required: boolean;
    date: string | null;
    reason: string;
  };
}

export interface AIPipelineResponse {
  status: 'SUCCESS' | 'AUDIO_ERROR' | 'TRANSCRIPTION_ERROR' | 'LLM_ERROR' | 'INVALID_LLM_OUTPUT' | 'PIPELINE_ERROR';
  audio_path: string;
  transcript: string;
  clean_transcript?: string;
  analysis: AIAnalysisResult;
  metadata: {
    processing_time_seconds: number;
    audio_duration_seconds: number;
    transcription_model: string;
    llm_provider: string;
    llm_model: string;
    errors: string[];
  };
}

export interface AIHealthResponse {
  status: string;
  service?: string;
  whisper_model?: string;
  llm_provider?: string;
  llm_model?: string;
  error?: string;
}

declare global {
  interface Window {
    ai?: {
      checkHealth: () => Promise<AIHealthResponse>;
      processCall: (audioPath: string) => Promise<AIPipelineResponse>;
      processSampleCall: () => Promise<AIPipelineResponse>;
    };
    electronAPI?: {
      platform: string;
      downloadToTemp: (url: string, filename: string) => Promise<string>;
      exportPdf: (html: string, filename: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean }>;
      notify: (title: string, body: string) => Promise<{ success: boolean; error?: string }>;
    };
  }
}


