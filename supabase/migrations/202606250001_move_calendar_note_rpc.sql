create or replace function public.move_calendar_note(
  note_id uuid,
  target_date date,
  target_sort_order integer
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.calendar_notes
  set note_date = target_date,
      sort_order = target_sort_order
  where id = note_id
    and owner_id = auth.uid();

  if not found then
    raise exception 'calendar note not found or not allowed' using errcode = 'P0002';
  end if;
end;
$$;

grant execute on function public.move_calendar_note(uuid, date, integer) to authenticated;
