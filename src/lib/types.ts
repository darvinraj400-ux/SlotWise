import type { Tables } from "@/lib/supabase/database.types";

export type BusinessSettings = Tables<"business_settings">;
export type Customer = Tables<"customers">;
export type Service = Tables<"services">;
export type Staff = Tables<"staff">;
export type StaffWorkingHours = Tables<"staff_working_hours">;
export type StaffTimeOff = Tables<"staff_time_off">;
export type Appointment = Tables<"appointments">;
export type AppointmentEvent = Tables<"appointment_events">;

export type AppointmentWithRelations = Appointment & {
  customers: Customer | null;
  staff: Staff | null;
  services: Service | null;
};

export type StaffWithHours = Staff & {
  staff_working_hours: StaffWorkingHours[];
};

export type CustomerSummary = Pick<
  Customer,
  "id" | "full_name" | "email" | "phone"
>;

export type StaffSummary = Pick<Staff, "id" | "full_name">;

export type ServiceSummary = Pick<Service, "id" | "name">;
