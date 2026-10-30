-- SlotWise: extensions, shared helpers, and business settings.
set search_path = public, extensions;

create extension if not exists btree_gist with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.business_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  business_name text not null,
  timezone text not null default 'Asia/Kuala_Lumpur',
  currency_code text not null default 'MYR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_settings_name_length
    check (char_length(btrim(business_name)) between 1 and 120),
  constraint business_settings_currency_format
    check (currency_code ~ '^[A-Z]{3}$')
);

comment on table public.business_settings is
  'One row per authenticated business owner. Owns timezone and currency preferences.';

create or replace function public.validate_business_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_timezone_names tz
    where tz.name = new.timezone
  ) then
    raise exception 'Unknown time zone: %', new.timezone using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger business_settings_validate_timezone
before insert or update of timezone on public.business_settings
for each row execute function public.validate_business_timezone();

create trigger business_settings_set_updated_at
before update on public.business_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.business_settings (user_id, business_name)
  values (
    new.id,
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'business_name'), ''),
        'My business'
      ),
      120
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
