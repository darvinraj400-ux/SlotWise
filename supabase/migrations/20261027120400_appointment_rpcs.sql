-- SlotWise: transaction-safe appointment operations.
-- All functions use an empty search path, schema-qualified names, and auth.uid().
set search_path = public, extensions;

create or replace function public._validate_appointment_slot(
  p_customer_id uuid,
  p_staff_id uuid,
  p_service_id uuid,
  p_start_at timestamptz,
  p_require_active_customer boolean default true
)
returns table (
  end_at timestamptz,
  service_name text,
  duration_minutes integer,
  price_amount numeric
)
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_timezone text;
  v_duration integer;
  v_price numeric;
  v_service_name text;
  v_end_at timestamptz;
  v_local_start timestamp;
  v_local_end timestamp;
  v_weekday integer;
  v_work_start time;
  v_work_end time;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_start_at is null then
    raise exception 'Choose a start time for the appointment.' using errcode = 'SW002';
  end if;

  if p_start_at <= now() then
    raise exception 'Appointments must start in the future.' using errcode = 'SW002';
  end if;

  select bs.timezone
  into v_timezone
  from public.business_settings bs
  where bs.user_id = v_user_id;

  if v_timezone is null then
    raise exception 'Business settings are missing.' using errcode = 'SW006';
  end if;

  if not exists (
    select 1
    from public.customers c
    where c.id = p_customer_id
      and c.user_id = v_user_id
      and (c.is_active or not p_require_active_customer)
  ) then
    raise exception 'The selected customer is unavailable.' using errcode = 'SW006';
  end if;

  if not exists (
    select 1
    from public.staff s
    where s.id = p_staff_id
      and s.user_id = v_user_id
      and s.is_active
  ) then
    raise exception 'The selected staff member is unavailable.' using errcode = 'SW006';
  end if;

  select sv.name, sv.duration_minutes, sv.price_amount
  into v_service_name, v_duration, v_price
  from public.services sv
  where sv.id = p_service_id
    and sv.user_id = v_user_id
    and sv.is_active;

  if not found then
    raise exception 'The selected service is unavailable.' using errcode = 'SW006';
  end if;

  v_end_at := p_start_at + make_interval(mins => v_duration);
  v_local_start := p_start_at at time zone v_timezone;
  v_local_end := v_end_at at time zone v_timezone;

  if v_local_start::date <> v_local_end::date then
    raise exception 'Appointments must fit within a single business day.' using errcode = 'SW003';
  end if;

  v_weekday := extract(isodow from v_local_start)::integer;

  select wh.start_time, wh.end_time
  into v_work_start, v_work_end
  from public.staff_working_hours wh
  where wh.user_id = v_user_id
    and wh.staff_id = p_staff_id
    and wh.weekday = v_weekday;

  if not found then
    raise exception 'The staff member is not scheduled to work that day.' using errcode = 'SW003';
  end if;

  if v_local_start::time < v_work_start or v_local_end::time > v_work_end then
    raise exception 'The appointment falls outside the staff member''s working hours.' using errcode = 'SW003';
  end if;

  if exists (
    select 1
    from public.staff_time_off t
    where t.user_id = v_user_id
      and t.staff_id = p_staff_id
      and tstzrange(t.starts_at, t.ends_at, '[)')
          && tstzrange(p_start_at, v_end_at, '[)')
  ) then
    raise exception 'The staff member is on time off during that slot.' using errcode = 'SW004';
  end if;

  return query select v_end_at, v_service_name, v_duration, v_price;
end;
$$;

revoke all on function public._validate_appointment_slot(uuid, uuid, uuid, timestamptz, boolean)
  from public, anon, authenticated;


create or replace function public.create_appointment(
  p_customer_id uuid,
  p_staff_id uuid,
  p_service_id uuid,
  p_start_at timestamptz,
  p_notes text default null
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_end_at timestamptz;
  v_service_name text;
  v_duration integer;
  v_price numeric;
  v_appointment public.appointments;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_notes is not null and char_length(p_notes) > 4000 then
    raise exception 'Notes must be 4000 characters or fewer.' using errcode = '22001';
  end if;

  select t.end_at, t.service_name, t.duration_minutes, t.price_amount
  into v_end_at, v_service_name, v_duration, v_price
  from public._validate_appointment_slot(
    p_customer_id,
    p_staff_id,
    p_service_id,
    p_start_at,
    true
  ) as t;

  insert into public.appointments (
    user_id,
    customer_id,
    staff_id,
    service_id,
    start_at,
    end_at,
    status,
    notes,
    service_name_snapshot,
    duration_minutes_snapshot,
    price_amount_snapshot
  )
  values (
    v_user_id,
    p_customer_id,
    p_staff_id,
    p_service_id,
    p_start_at,
    v_end_at,
    'pending',
    nullif(btrim(p_notes), ''),
    v_service_name,
    v_duration,
    v_price
  )
  returning * into v_appointment;

  insert into public.appointment_events (
    user_id,
    appointment_id,
    event_type,
    to_status,
    summary
  )
  values (
    v_user_id,
    v_appointment.id,
    'created',
    'pending',
    'Appointment created'
  );

  return v_appointment;
exception
  when exclusion_violation then
    raise exception 'That time slot was just booked. Choose another time.' using errcode = 'SW001';
end;
$$;

revoke all on function public.create_appointment(uuid, uuid, uuid, timestamptz, text)
  from public, anon;
grant execute on function public.create_appointment(uuid, uuid, uuid, timestamptz, text)
  to authenticated;


create or replace function public.reschedule_appointment(
  p_appointment_id uuid,
  p_staff_id uuid,
  p_service_id uuid,
  p_start_at timestamptz,
  p_notes text default null
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.appointments;
  v_end_at timestamptz;
  v_service_name text;
  v_duration integer;
  v_price numeric;
  v_timezone text;
  v_appointment public.appointments;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_notes is not null and char_length(p_notes) > 4000 then
    raise exception 'Notes must be 4000 characters or fewer.' using errcode = '22001';
  end if;

  select *
  into v_existing
  from public.appointments a
  where a.id = p_appointment_id
    and a.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Appointment not found.' using errcode = 'SW006';
  end if;

  if v_existing.status not in ('pending', 'confirmed') then
    raise exception 'Only pending or confirmed appointments can be rescheduled.' using errcode = 'SW005';
  end if;

  select t.end_at, t.service_name, t.duration_minutes, t.price_amount
  into v_end_at, v_service_name, v_duration, v_price
  from public._validate_appointment_slot(
    v_existing.customer_id,
    p_staff_id,
    p_service_id,
    p_start_at,
    false
  ) as t;

  update public.appointments
  set staff_id = p_staff_id,
      service_id = p_service_id,
      start_at = p_start_at,
      end_at = v_end_at,
      service_name_snapshot = v_service_name,
      duration_minutes_snapshot = v_duration,
      price_amount_snapshot = v_price,
      notes = nullif(btrim(p_notes), '')
  where id = p_appointment_id
    and user_id = v_user_id
  returning * into v_appointment;

  select bs.timezone
  into v_timezone
  from public.business_settings bs
  where bs.user_id = v_user_id;

  insert into public.appointment_events (
    user_id,
    appointment_id,
    event_type,
    from_status,
    to_status,
    summary
  )
  values (
    v_user_id,
    p_appointment_id,
    'rescheduled',
    v_existing.status,
    v_existing.status,
    format(
      'Rescheduled from %s to %s',
      to_char(v_existing.start_at at time zone coalesce(v_timezone, 'UTC'), 'Dy, Mon DD at HH12:MI AM'),
      to_char(p_start_at at time zone coalesce(v_timezone, 'UTC'), 'Dy, Mon DD at HH12:MI AM')
    )
  );

  return v_appointment;
exception
  when exclusion_violation then
    raise exception 'That time slot was just booked. Choose another time.' using errcode = 'SW001';
end;
$$;

revoke all on function public.reschedule_appointment(uuid, uuid, uuid, timestamptz, text)
  from public, anon;
grant execute on function public.reschedule_appointment(uuid, uuid, uuid, timestamptz, text)
  to authenticated;


create or replace function public.transition_appointment_status(
  p_appointment_id uuid,
  p_new_status text
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.appointments;
  v_allowed boolean := false;
  v_appointment public.appointments;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_new_status is null
     or p_new_status not in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') then
    raise exception 'Unknown appointment status.' using errcode = 'SW005';
  end if;

  select *
  into v_existing
  from public.appointments a
  where a.id = p_appointment_id
    and a.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Appointment not found.' using errcode = 'SW006';
  end if;

  if v_existing.status = p_new_status then
    raise exception 'The appointment is already % ', replace(p_new_status, '_', ' ')
      using errcode = 'SW005';
  end if;

  case v_existing.status
    when 'pending' then
      v_allowed := p_new_status in ('confirmed', 'cancelled');
    when 'confirmed' then
      v_allowed := p_new_status in ('in_progress', 'cancelled', 'no_show');
    when 'in_progress' then
      v_allowed := p_new_status = 'completed';
    else
      v_allowed := false;
  end case;

  if not v_allowed then
    raise exception 'The appointment cannot move from % to %.',
      replace(v_existing.status, '_', ' '),
      replace(p_new_status, '_', ' ')
      using errcode = 'SW005';
  end if;

  if p_new_status = 'in_progress'
     and (now() < v_existing.start_at - interval '15 minutes' or now() > v_existing.end_at) then
    raise exception 'An appointment can start from 15 minutes before its scheduled time until it ends.'
      using errcode = 'SW007';
  end if;

  if p_new_status = 'no_show' and now() < v_existing.start_at then
    raise exception 'A no-show can only be marked after the scheduled start time.'
      using errcode = 'SW007';
  end if;

  update public.appointments
  set status = p_new_status
  where id = p_appointment_id
    and user_id = v_user_id
  returning * into v_appointment;

  insert into public.appointment_events (
    user_id,
    appointment_id,
    event_type,
    from_status,
    to_status,
    summary
  )
  values (
    v_user_id,
    p_appointment_id,
    'status_changed',
    v_existing.status,
    p_new_status,
    format(
      'Status changed from %s to %s',
      initcap(replace(v_existing.status, '_', ' ')),
      initcap(replace(p_new_status, '_', ' '))
    )
  );

  return v_appointment;
end;
$$;

revoke all on function public.transition_appointment_status(uuid, text)
  from public, anon;
grant execute on function public.transition_appointment_status(uuid, text)
  to authenticated;

-- Trigger-only helpers are never callable through the API.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.validate_business_timezone() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
