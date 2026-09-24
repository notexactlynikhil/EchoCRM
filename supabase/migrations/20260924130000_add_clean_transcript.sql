-- LLM-facing cleaned transcript (filler words / disfluencies removed).
-- The verbatim transcript remains in calls.raw_transcript and is user-facing.
ALTER TABLE public.calls
    ADD COLUMN IF NOT EXISTS clean_transcript JSONB;
