create table public.idea_types (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type_id uuid not null references public.idea_types(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 240),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ideas_owner_type_idx on public.ideas(owner_id, type_id);

create trigger ideas_set_updated_at before update on public.ideas
for each row execute function public.set_updated_at();

alter table public.idea_types enable row level security;
alter table public.ideas enable row level security;

create policy "Owner can manage idea types" on public.idea_types for all to authenticated
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "Owner can manage ideas" on public.ideas for all to authenticated
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.idea_types
    where idea_types.id = ideas.type_id
      and idea_types.owner_id = auth.uid()
  )
)
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.idea_types
    where idea_types.id = ideas.type_id
      and idea_types.owner_id = auth.uid()
  )
);
