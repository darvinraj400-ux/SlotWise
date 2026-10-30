-- SlotWise: appointments, immutable service snapshots, audit events, and overlap protection.
set search_path = public, extensions;

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  customer_id uuid not null,
  staff_id uuid not null,
  service_id uuid not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'pending',
  notes text,
  service_name_snapshot text not null,
  duration_minutes_snapshot integer not null,
  price_amount_snapshot numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_status_check
    check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  constraint appointments_valid_range
    check (end_at > start_at),
  constraint appointments_duration_snapshot_positive
    check (duration_minutes_snapshot between 1 and 1440),
  constraint appointments_price_snapshot_non_negative
    check (price_amount_snapshot >= 0),
  constraint appointments_service_name_snapshot_length
    check (char_length(service_name_snapshot) between 1 and 120),
  constraint appointments_notes_length
    check (notes is null or char_length(notes) <= 4000),
  constraint appointments_customer_fk
    foreign key (customer_id, user_id) references public.customers (id, user_id) on delete restrict,
  constraint appointments_staff_fk
    foreign key (staff_id, user_id) references public.staff (id, user_id) on delete restrict,
  constraint appointments_service_fk
    foreign key (service_id, user_id) references public.services (id, user_id) on delete restrict,
  constraint appointments_id_user_id_key unique (id, user_id),
  constraint appointments_no_overlap
    exclude using gist (
      user_id with =,
      staff_id with =,
      tstzrange(start_at, end_at, '[)') with &&
    ) where (status in ('pending', 'confirmed', 'in_progress'))
);

comment on constraint appointments_no_overlap on public.appointments is
  'Active appointments for the same staff member may not overlap. Half-open ranges allow back-to-back bookings. Cancelled, completed, and no-show appointments do not block slots.';

comment on table public.appointments is
  'Appointments keep service name, duration, and price snapshots so later catalog edits cannot rewrite history.';

create index appointments_user_start_idx
  on public.appointments (user_id, start_at);
create index appointments_user_staff_start_idx
  on public.appointments (user_id, staff_id, start_at);
create index appointments_user_customer_start_idx
  on public.appointments (user_id, customer_id, start_at desc);
create index appointments_user_status_start_idx
  on public.appointments (user_id, status, start_at);
create index appointments_user_service_start_idx
  on public.appointments (user_id, service_id, start_at);
create index appointments_user_created_idx
  on public.appointments (user_id, created_at desc);

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create table public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  appointment_id uuid not null,
  event_type text not null,
  from_status text,
  to_status text,
  summary text not null,
  created_at timestamptz not null default now(),
  constraint appointment_events_type_check
    check (event_type in ('created', 'rescheduled', 'status_changed', 'notes_updated')),
  constraint appointment_events_summary_length
    check (char_length(summary) between 1 and 500),
  constraint appointment_events_appointment_fk
    foreign key (appointment_id, user_id) references public.appointments (id, user_id) on delete cascade
);

create index appointment_events_appointment_idx
  on public.appointment_events (user_id, appointment_id, created_at);
