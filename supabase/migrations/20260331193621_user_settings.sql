create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  tts_voice text default 'pl-pl-x-bmg-network',
  tts_rate float default 0.9,
  tts_pitch float default 1.0,
  voice_confirmations boolean default true,
  auto_read_after_save boolean default false,
  max_notes_to_read integer default 3,
  tts_silent_mode boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_settings enable row level security;

create policy "own user settings" on user_settings
  for all using (auth.uid() = user_id);
