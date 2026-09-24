-- Ensure authenticated app users (and service_role) have table privileges.
-- RLS policies still restrict every row to its owner.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_summaries TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calls TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated, service_role;
