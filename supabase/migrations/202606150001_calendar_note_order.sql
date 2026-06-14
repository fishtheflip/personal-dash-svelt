alter table public.calendar_notes
add column sort_order integer not null default 0;

with ordered_notes as (
  select
    id,
    (row_number() over (
      partition by owner_id, note_date
      order by created_at, id
    ) - 1)::integer as position
  from public.calendar_notes
)
update public.calendar_notes
set sort_order = ordered_notes.position
from ordered_notes
where calendar_notes.id = ordered_notes.id;

create index calendar_notes_owner_date_order_idx
on public.calendar_notes(owner_id, note_date, sort_order);
