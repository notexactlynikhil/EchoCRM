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
