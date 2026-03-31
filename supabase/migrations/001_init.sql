-- Notatki głosowe / pomysły
create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  transcript text,          -- oryginalny transkrypt z Whisper
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Listy (zakupy, zadania, cokolwiek)
create table lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz default now()
);

create table list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references lists(id) on delete cascade,
  content text not null,
  done boolean default false,
  position integer default 0,
  created_at timestamptz default now()
);

-- RLS: każdy widzi tylko swoje dane
alter table notes     enable row level security;
alter table lists     enable row level security;
alter table list_items enable row level security;

create policy "own notes"      on notes      for all using (auth.uid() = user_id);
create policy "own lists"      on lists      for all using (auth.uid() = user_id);
create policy "own list items" on list_items for all
  using (list_id in (select id from lists where user_id = auth.uid()));