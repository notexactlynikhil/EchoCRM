-- Create custom Types
CREATE TYPE call_status AS ENUM ('recording', 'processing', 'done');
CREATE TYPE task_status AS ENUM ('pending', 'done');
CREATE TYPE deal_stage AS ENUM ('prospecting', 'negotiation', 'closing', 'won', 'lost');
CREATE TYPE sentiment_type AS ENUM ('positive', 'neutral', 'negative');

-- 1. users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. customers table
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    company TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. calls table
CREATE TABLE public.calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    audio_url TEXT,
    duration_seconds INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    raw_transcript JSONB DEFAULT '[]',
    status call_status DEFAULT 'recording',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. call_summaries table
CREATE TABLE public.call_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
    summary_text TEXT,
    product TEXT,
    deal_stage deal_stage,
    sentiment sentiment_type,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. tasks table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    call_id UUID REFERENCES public.calls(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    due_date TIMESTAMPTZ,
    status task_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. deals table
CREATE TABLE public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product TEXT NOT NULL,
    stage deal_stage DEFAULT 'prospecting',
    expected_close_date TIMESTAMPTZ,
    value NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create public.users when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- users
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- customers
CREATE POLICY "Users can CRUD own customers" ON public.customers FOR ALL USING (auth.uid() = owner_id);

-- calls
CREATE POLICY "Users can CRUD own calls" ON public.calls FOR ALL USING (auth.uid() = owner_id);

-- call_summaries
CREATE POLICY "Users can CRUD own call summaries" ON public.call_summaries FOR ALL USING (
    EXISTS (SELECT 1 FROM public.calls WHERE calls.id = call_summaries.call_id AND calls.owner_id = auth.uid())
);

-- tasks
CREATE POLICY "Users can CRUD own tasks" ON public.tasks FOR ALL USING (auth.uid() = owner_id);

-- deals
CREATE POLICY "Users can CRUD own deals" ON public.deals FOR ALL USING (auth.uid() = owner_id);

-- Realtime Setup
-- We need to drop the default publication and recreate it for specific tables
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_summaries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
