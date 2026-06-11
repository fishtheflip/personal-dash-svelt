create table public.routines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  created_at timestamptz not null default now(),
  unique (owner_id, title)
);

create table public.routine_completions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  routine_id uuid not null references public.routines(id) on delete cascade,
  completion_date date not null,
  created_at timestamptz not null default now(),
  unique (routine_id, completion_date)
);

create index routine_completions_owner_date_idx
on public.routine_completions(owner_id, completion_date desc);

alter table public.routines enable row level security;
alter table public.routine_completions enable row level security;

create policy "Owner can manage routines" on public.routines for all to authenticated
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "Owner can manage routine completions" on public.routine_completions for all to authenticated
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.routines
    where routines.id = routine_completions.routine_id
      and routines.owner_id = auth.uid()
  )
)
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.routines
    where routines.id = routine_completions.routine_id
      and routines.owner_id = auth.uid()
  )
);
