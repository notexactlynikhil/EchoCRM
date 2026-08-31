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

export interface Call {
  id: string;
  customer_id: string;
  owner_id: string;
  audio_url?: string;
  duration_seconds?: number;
  started_at: string;
  raw_transcript: any;
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
  krill_search_enabled?: boolean;
  krill_api_key_configured?: boolean;
  error?: string;
}

export interface WebSearchResultItem {
  title: string;
  url: string;
  snippet: string;
}

export interface AIQueryResult {
  query: string;
  answer: string;
  used_web_search: boolean;
  search_query?: string | null;
  search_results?: WebSearchResultItem[];
  search_error?: string | null;
  sources: string[];
  metadata?: {
    llm_provider: string;
    llm_model: string;
    krill_enabled: boolean;
  };
}

declare global {
  interface Window {
    ai?: {
      checkHealth: () => Promise<AIHealthResponse>;
      processCall: (audioPath: string) => Promise<AIPipelineResponse>;
      processSampleCall: () => Promise<AIPipelineResponse>;
      query: (prompt: string, context?: string, enableWebSearch?: boolean) => Promise<AIQueryResult>;
    };
  }
}


