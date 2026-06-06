create extension if not exists pgcrypto;

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 300),
  area text not null check (char_length(trim(area)) between 1 and 80),
  status text not null default 'backlog' check (status in ('backlog', 'progress', 'done')),
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calendar_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  note_date date not null,
  title text not null check (char_length(trim(title)) between 1 and 300),
  text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.useful_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  url text not null check (url ~* '^https?://'),
  category text not null check (char_length(trim(category)) between 1 and 80),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_owner_status_idx on public.goals(owner_id, status);
create index calendar_notes_owner_date_idx on public.calendar_notes(owner_id, note_date);
create index useful_links_owner_category_idx on public.useful_links(owner_id, category);

create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger goals_set_updated_at before update on public.goals
for each row execute function public.set_updated_at();
create trigger calendar_notes_set_updated_at before update on public.calendar_notes
for each row execute function public.set_updated_at();
create trigger useful_links_set_updated_at before update on public.useful_links
for each row execute function public.set_updated_at();

alter table public.spaces enable row level security;
alter table public.goals enable row level security;
alter table public.calendar_notes enable row level security;
alter table public.useful_links enable row level security;

create policy "Owner can manage spaces" on public.spaces for all to authenticated
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Owner can manage goals" on public.goals for all to authenticated
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Owner can manage calendar notes" on public.calendar_notes for all to authenticated
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Owner can manage useful links" on public.useful_links for all to authenticated
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
