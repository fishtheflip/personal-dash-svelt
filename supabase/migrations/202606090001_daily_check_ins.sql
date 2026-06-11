create table public.daily_check_ins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  check_in_date date not null,
  mood smallint not null default 3 check (mood between 1 and 5),
  energy smallint not null default 3 check (energy between 1 and 5),
  highlight text not null default '',
  blockers text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, check_in_date)
);

create index daily_check_ins_owner_date_idx
on public.daily_check_ins(owner_id, check_in_date desc);

create trigger daily_check_ins_set_updated_at before update on public.daily_check_ins
for each row execute function public.set_updated_at();

alter table public.daily_check_ins enable row level security;

create policy "Owner can manage daily check ins" on public.daily_check_ins for all to authenticated
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
