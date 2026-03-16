-- Contact messages sent via member profile pages
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  sender_email text not null,
  message text not null,
  created_at timestamptz default now()
);

-- RLS
alter table public.contact_messages enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can send contact messages' AND tablename = 'contact_messages') THEN
    create policy "Anyone can send contact messages"
      on public.contact_messages for insert
      with check (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Recipients can read own messages' AND tablename = 'contact_messages') THEN
    create policy "Recipients can read own messages"
      on public.contact_messages for select
      using (auth.uid() = recipient_id);
  END IF;
END $$;
