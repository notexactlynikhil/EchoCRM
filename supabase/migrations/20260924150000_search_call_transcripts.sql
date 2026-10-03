-- Keyword search across user-facing call transcripts.
-- SECURITY INVOKER so the existing calls / customers RLS policies apply.
CREATE OR REPLACE FUNCTION public.search_call_transcripts(search_term TEXT)
RETURNS TABLE (
    id UUID,
    customer_id UUID,
    customer_name TEXT,
    started_at TIMESTAMPTZ,
    snippet TEXT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT
        c.id,
        c.customer_id,
        cu.name AS customer_name,
        c.started_at,
        substring(
            COALESCE(c.raw_transcript #>> '{}', '')
            FROM GREATEST(1, position(lower(search_term) IN lower(COALESCE(c.raw_transcript #>> '{}', ''))) - 60)
            FOR 240
        ) AS snippet
    FROM public.calls c
    JOIN public.customers cu ON cu.id = c.customer_id
    WHERE COALESCE(c.raw_transcript #>> '{}', '') ILIKE '%' || search_term || '%'
    ORDER BY c.started_at DESC
    LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION public.search_call_transcripts(TEXT) TO authenticated, service_role;
