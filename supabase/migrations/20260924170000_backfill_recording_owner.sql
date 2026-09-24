-- Recordings uploaded before owner-based RLS have owner_id = NULL and are
-- therefore invisible under the new policies. When the project has a single
-- user, assign those orphaned recordings to that user.
UPDATE public.meeting_recordings
SET owner_id = (SELECT id FROM public.users ORDER BY created_at LIMIT 1)
WHERE owner_id IS NULL
  AND (SELECT count(*) FROM public.users) = 1;
