-- Create meeting_recordings table for browser extension recordings
CREATE TABLE IF NOT EXISTS public.meeting_recordings (
    id UUID PRIMARY KEY,
    platform TEXT,
    meeting_url TEXT,
    started_at TIMESTAMPTZ,
    stopped_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    mime_type TEXT DEFAULT 'audio/webm',
    storage_path TEXT,
    status TEXT DEFAULT 'local_saved',
    disclosure_attempted BOOLEAN DEFAULT false,
    disclosure_delivered BOOLEAN DEFAULT false,
    disclosure_timestamp TIMESTAMPTZ,
    upload_attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.meeting_recordings ENABLE ROW LEVEL SECURITY;

-- Allow public and authenticated clients to insert / select / update recordings
CREATE POLICY "Allow select on meeting_recordings" ON public.meeting_recordings FOR SELECT USING (true);
CREATE POLICY "Allow insert on meeting_recordings" ON public.meeting_recordings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on meeting_recordings" ON public.meeting_recordings FOR UPDATE USING (true);

-- Create storage bucket for meeting recordings if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-recordings', 'meeting-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for meeting-recordings bucket
CREATE POLICY "Allow public read on meeting-recordings bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'meeting-recordings');

CREATE POLICY "Allow public upload on meeting-recordings bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'meeting-recordings');

CREATE POLICY "Allow public update on meeting-recordings bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'meeting-recordings');
