-- Create a test user in auth.users
-- Note: In a real environment, users sign up via the API, which hashes passwords and fires the trigger.
-- For local testing, we inject directly into auth.users.
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'test@example.com', crypt('password123', gen_salt('bf')), now(), '{"name": "Test User"}')
ON CONFLICT (id) DO NOTHING;

-- Seed customers
INSERT INTO public.customers (id, owner_id, name, phone, email, company, tags)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Acme Corp', '555-0100', 'contact@acme.com', 'Acme Inc.', '{"enterprise", "high-priority"}'),
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Jane Doe', '555-0200', 'jane@startup.io', 'Startup IO', '{"smb"}')
ON CONFLICT (id) DO NOTHING;

-- Seed deals
INSERT INTO public.deals (id, customer_id, owner_id, product, stage, expected_close_date, value)
VALUES
    ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Enterprise Plan', 'negotiation', now() + interval '30 days', 50000),
    ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Pro Plan', 'prospecting', now() + interval '60 days', 1200)
ON CONFLICT (id) DO NOTHING;

-- Seed calls
INSERT INTO public.calls (id, customer_id, owner_id, audio_url, duration_seconds, started_at, raw_transcript, status)
VALUES
    ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'https://example.com/audio1.mp3', 300, now() - interval '2 days', '[{"speaker": "Sales", "text": "Hi, how are you?", "timestamp": 0}, {"speaker": "Customer", "text": "Good, we are interested in the enterprise plan.", "timestamp": 5}]'::jsonb, 'done')
ON CONFLICT (id) DO NOTHING;

-- Seed call summaries
INSERT INTO public.call_summaries (id, call_id, summary_text, product, deal_stage, sentiment)
VALUES
    ('55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444441', 'Customer expressed strong interest in the Enterprise plan. Wants to move forward to negotiation.', 'Enterprise Plan', 'negotiation', 'positive')
ON CONFLICT (id) DO NOTHING;

-- Seed tasks
INSERT INTO public.tasks (id, customer_id, call_id, owner_id, description, due_date, status)
VALUES
    ('66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444441', '00000000-0000-0000-0000-000000000001', 'Send final contract for Enterprise Plan', now() + interval '2 days', 'pending'),
    ('66666666-6666-6666-6666-666666666662', '22222222-2222-2222-2222-222222222222', NULL, '00000000-0000-0000-0000-000000000001', 'Follow up on introductory email', now() + interval '1 day', 'pending')
ON CONFLICT (id) DO NOTHING;
