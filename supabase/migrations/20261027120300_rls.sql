-- SlotWise: row level security and least-privilege table grants.
alter table public.business_settings enable row level security;
alter table public.customers enable row level security;
alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.staff_working_hours enable row level security;
alter table public.staff_time_off enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_events enable row level security;

-- Business settings ---------------------------------------------------------
create policy "Owners read their business settings"
on public.business_settings for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners create their business settings"
on public.business_settings for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Owners update their business settings"
on public.business_settings for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Customers -----------------------------------------------------------------
create policy "Owners read their customers"
on public.customers for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners create their customers"
on public.customers for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Owners update their customers"
on public.customers for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Services ------------------------------------------------------------------
create policy "Owners read their services"
on public.services for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners create their services"
on public.services for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Owners update their services"
on public.services for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Staff ---------------------------------------------------------------------
create policy "Owners read their staff"
on public.staff for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners create their staff"
on public.staff for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Owners update their staff"
on public.staff for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Working hours -------------------------------------------------------------
create policy "Owners read their working hours"
on public.staff_working_hours for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners create their working hours"
on public.staff_working_hours for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Owners update their working hours"
on public.staff_working_hours for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Owners delete their working hours"
on public.staff_working_hours for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Time off ------------------------------------------------------------------
create policy "Owners read their staff time off"
on public.staff_time_off for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners create their staff time off"
on public.staff_time_off for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Owners delete their staff time off"
on public.staff_time_off for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Appointments are read-only for clients. All writes go through RPCs. -------
create policy "Owners read their appointments"
on public.appointments for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners read their appointment history"
on public.appointment_events for select
to authenticated
using ((select auth.uid()) = user_id);

-- Table privileges ----------------------------------------------------------
revoke all on table
  public.business_settings,
  public.customers,
  public.services,
  public.staff,
  public.staff_working_hours,
  public.staff_time_off,
  public.appointments,
  public.appointment_events
from anon, authenticated;

grant select, insert, update on table public.business_settings to authenticated;
grant select, insert, update on table public.customers to authenticated;
grant select, insert, update on table public.services to authenticated;
grant select, insert, update on table public.staff to authenticated;
grant select, insert, update, delete on table public.staff_working_hours to authenticated;
grant select, insert, delete on table public.staff_time_off to authenticated;
grant select on table public.appointments to authenticated;
grant select on table public.appointment_events to authenticated;
