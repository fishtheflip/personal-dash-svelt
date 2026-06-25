create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  phone text not null default '',
  telegram text not null default '',
  linkedin text not null default '',
  social text not null default '',
  note text not null default '',
  comments text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contacts_owner_name_idx on public.contacts(owner_id, lower(name));

create trigger contacts_set_updated_at before update on public.contacts
for each row execute function public.set_updated_at();

alter table public.contacts enable row level security;

create policy "Owner can manage contacts" on public.contacts for all to authenticated
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
