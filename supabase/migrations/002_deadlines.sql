-- Dodaj deadline do notatek
alter table notes add column if not exists deadline timestamptz;
alter table notes add column if not exists is_recurring boolean default false;
alter table notes add column if not exists recurrence_rule text;

-- Dodaj deadline do elementów list
alter table list_items add column if not exists deadline timestamptz;
alter table list_items add column if not exists is_recurring boolean default false;
alter table list_items add column if not exists recurrence_rule text;

-- Tabela ustawień przypomnień
create table if not exists reminder_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  remind_before_minutes integer[] default array[60],
  remind_day_before boolean default true,
  remind_morning_of boolean default true,
  morning_reminder_hour integer default 8,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table reminder_settings enable row level security;
create policy "own reminder settings" on reminder_settings
  for all using (auth.uid() = user_id);
