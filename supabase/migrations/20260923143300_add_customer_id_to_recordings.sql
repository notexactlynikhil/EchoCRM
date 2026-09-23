ALTER TABLE public.meeting_recordings ADD COLUMN customer_id UUID REFERENCES public.customers(id);
