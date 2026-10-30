-- SlotWise: atomic staff schedule replacement.
set search_path = public, extensions;

create or replace function public.replace_staff_working_hours(
  p_staff_id uuid,
  p_days jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_day_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_days is null or jsonb_typeof(p_days) <> 'array' then
    raise exception 'The schedule payload is invalid.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.staff s
    where s.id = p_staff_id
      and s.user_id = v_user_id
  ) then
    raise exception 'The selected staff member is unavailable.' using errcode = 'SW006';
  end if;

  v_day_count := jsonb_array_length(p_days);
  if v_day_count > 7 then
    raise exception 'A weekly schedule can contain at most seven days.' using errcode = '22023';
  end if;

  delete from public.staff_working_hours wh
  where wh.user_id = v_user_id
    and wh.staff_id = p_staff_id;

  insert into public.staff_working_hours (
    user_id,
    staff_id,
    weekday,
    start_time,
    end_time
  )
  select
    v_user_id,
    p_staff_id,
    day.weekday,
    day.start_time,
    day.end_time
  from jsonb_to_recordset(p_days) as day(
    weekday smallint,
    start_time time,
    end_time time
  );

exception
  when unique_violation then
    raise exception 'Each weekday can only appear once.' using errcode = '22023';
  when check_violation then
    raise exception 'Working hours must have an end time after the start time.' using errcode = '22023';
end;
$$;

revoke all on function public.replace_staff_working_hours(uuid, jsonb) from public, anon;
grant execute on function public.replace_staff_working_hours(uuid, jsonb) to authenticated;
