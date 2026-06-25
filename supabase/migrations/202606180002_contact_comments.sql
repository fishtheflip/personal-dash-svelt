alter table public.contacts
add column if not exists comments text not null default '';
