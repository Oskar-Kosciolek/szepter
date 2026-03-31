create table if not exists recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  transcript text not null,
  command_type text,
  command_payload jsonb,
  duration_seconds float,
  created_at timestamptz default now()
);

alter table recordings enable row level security;

create policy "own recordings" on recordings
  for all using (auth.uid() = user_id);
