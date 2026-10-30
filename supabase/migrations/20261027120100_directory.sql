-- SlotWise: customers, services, staff, working hours, and time off.
set search_path = public, extensions;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_full_name_length
    check (char_length(btrim(full_name)) between 1 and 120),
  constraint customers_email_length
    check (email is null or char_length(email) <= 320),
  constraint customers_phone_length
    check (phone is null or char_length(phone) <= 40),
  constraint customers_notes_length
    check (notes is null or char_length(notes) <= 4000),
  constraint customers_id_user_id_key unique (id, user_id)
);

create index customers_user_name_idx on public.customers (user_id, lower(full_name));
create index customers_user_active_idx on public.customers (user_id, is_active, created_at desc);

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create table public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null,
  price_amount numeric(10, 2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_name_length
    check (char_length(btrim(name)) between 1 and 120),
  constraint services_description_length
    check (description is null or char_length(description) <= 2000),
  constraint services_duration_positive
    check (duration_minutes between 5 and 720),
  constraint services_price_non_negative
    check (price_amount >= 0 and price_amount <= 1000000),
  constraint services_id_user_id_key unique (id, user_id)
);

create index services_user_active_idx on public.services (user_id, is_active, lower(name));

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_full_name_length
    check (char_length(btrim(full_name)) between 1 and 120),
  constraint staff_email_length
    check (email is null or char_length(email) <= 320),
  constraint staff_phone_length
    check (phone is null or char_length(phone) <= 40),
  constraint staff_notes_length
    check (notes is null or char_length(notes) <= 4000),
  constraint staff_id_user_id_key unique (id, user_id)
);

create index staff_user_name_idx on public.staff (user_id, lower(full_name));
create index staff_user_active_idx on public.staff (user_id, is_active, created_at desc);

create trigger staff_set_updated_at
before update on public.staff
for each row execute function public.set_updated_at();

create table public.staff_working_hours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  staff_id uuid not null,
  weekday smallint not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_working_hours_weekday_range
    check (weekday between 1 and 7),
  constraint staff_working_hours_valid_interval
    check (end_time > start_time),
  constraint staff_working_hours_one_per_weekday
    unique (user_id, staff_id, weekday),
  constraint staff_working_hours_staff_fk
    foreign key (staff_id, user_id) references public.staff (id, user_id) on delete cascade
);

comment on table public.staff_working_hours is
  'MVP: at most one working interval per staff member per ISO weekday (Monday = 1).';

create index staff_working_hours_staff_idx
  on public.staff_working_hours (user_id, staff_id, weekday);

create trigger staff_working_hours_set_updated_at
before update on public.staff_working_hours
for each row execute function public.set_updated_at();

create table public.staff_time_off (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  staff_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint staff_time_off_valid_range
    check (ends_at > starts_at),
  constraint staff_time_off_reason_length
    check (reason is null or char_length(reason) <= 500),
  constraint staff_time_off_staff_fk
    foreign key (staff_id, user_id) references public.staff (id, user_id) on delete cascade,
  constraint staff_time_off_no_overlap
    exclude using gist (
      user_id with =,
      staff_id with =,
      tstzrange(starts_at, ends_at, '[)') with &&
    )
);

create index staff_time_off_staff_range_idx
  on public.staff_time_off (user_id, staff_id, starts_at);
