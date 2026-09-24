-- Link AI-processed calls back to the meeting recording they originated from.
ALTER TABLE public.calls
    ADD COLUMN IF NOT EXISTS recording_id UUID REFERENCES public.meeting_recordings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS calls_recording_id_idx ON public.calls(recording_id);

-- Broadcast meeting_recording status changes so the desktop client reflects
-- processing progress live (the table was previously missing from the publication).
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_recordings;
