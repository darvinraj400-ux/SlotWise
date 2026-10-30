
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "appointment_events": {
                  Row: {
                    "appointment_id": string,"created_at": string,"event_type": string,"from_status": string | null,"id": string,"summary": string,"to_status": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "appointment_id": string,"created_at"?: string,"event_type": string,"from_status"?: string | null,"id"?: string,"summary": string,"to_status"?: string | null,"user_id": string
                  }
                  Update: {
                    "appointment_id"?: string,"created_at"?: string,"event_type"?: string,"from_status"?: string | null,"id"?: string,"summary"?: string,"to_status"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "appointment_events_appointment_fk"
      columns: ["appointment_id","user_id"]
isOneToOne: false
      referencedRelation: "appointments"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"appointments": {
                  Row: {
                    "created_at": string,"customer_id": string,"duration_minutes_snapshot": number,"end_at": string,"id": string,"notes": string | null,"price_amount_snapshot": number,"service_id": string,"service_name_snapshot": string,"staff_id": string,"start_at": string,"status": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"customer_id": string,"duration_minutes_snapshot": number,"end_at": string,"id"?: string,"notes"?: string | null,"price_amount_snapshot": number,"service_id": string,"service_name_snapshot": string,"staff_id": string,"start_at": string,"status"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"customer_id"?: string,"duration_minutes_snapshot"?: number,"end_at"?: string,"id"?: string,"notes"?: string | null,"price_amount_snapshot"?: number,"service_id"?: string,"service_name_snapshot"?: string,"staff_id"?: string,"start_at"?: string,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "appointments_customer_fk"
      columns: ["customer_id","user_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "appointments_service_fk"
      columns: ["service_id","user_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "appointments_staff_fk"
      columns: ["staff_id","user_id"]
isOneToOne: false
      referencedRelation: "staff"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"business_settings": {
                  Row: {
                    "business_name": string,"created_at": string,"currency_code": string,"timezone": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_name": string,"created_at"?: string,"currency_code"?: string,"timezone"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "business_name"?: string,"created_at"?: string,"currency_code"?: string,"timezone"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"customers": {
                  Row: {
                    "created_at": string,"email": string | null,"full_name": string,"id": string,"is_active": boolean,"notes": string | null,"phone": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"full_name": string,"id"?: string,"is_active"?: boolean,"notes"?: string | null,"phone"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string,"id"?: string,"is_active"?: boolean,"notes"?: string | null,"phone"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"services": {
                  Row: {
                    "created_at": string,"description": string | null,"duration_minutes": number,"id": string,"is_active": boolean,"name": string,"price_amount": number,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"duration_minutes": number,"id"?: string,"is_active"?: boolean,"name": string,"price_amount": number,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"duration_minutes"?: number,"id"?: string,"is_active"?: boolean,"name"?: string,"price_amount"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"staff": {
                  Row: {
                    "created_at": string,"email": string | null,"full_name": string,"id": string,"is_active": boolean,"notes": string | null,"phone": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"full_name": string,"id"?: string,"is_active"?: boolean,"notes"?: string | null,"phone"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string,"id"?: string,"is_active"?: boolean,"notes"?: string | null,"phone"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"staff_time_off": {
                  Row: {
                    "created_at": string,"ends_at": string,"id": string,"reason": string | null,"staff_id": string,"starts_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"ends_at": string,"id"?: string,"reason"?: string | null,"staff_id": string,"starts_at": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"ends_at"?: string,"id"?: string,"reason"?: string | null,"staff_id"?: string,"starts_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "staff_time_off_staff_fk"
      columns: ["staff_id","user_id"]
isOneToOne: false
      referencedRelation: "staff"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"staff_working_hours": {
                  Row: {
                    "created_at": string,"end_time": string,"id": string,"staff_id": string,"start_time": string,"updated_at": string,"user_id": string,"weekday": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"end_time": string,"id"?: string,"staff_id": string,"start_time": string,"updated_at"?: string,"user_id": string,"weekday": number
                  }
                  Update: {
                    "created_at"?: string,"end_time"?: string,"id"?: string,"staff_id"?: string,"start_time"?: string,"updated_at"?: string,"user_id"?: string,"weekday"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "staff_working_hours_staff_fk"
      columns: ["staff_id","user_id"]
isOneToOne: false
      referencedRelation: "staff"
      referencedColumns: ["id","user_id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "_validate_appointment_slot":
{ Args: { "p_customer_id": string,"p_require_active_customer"?: boolean,"p_service_id": string,"p_staff_id": string,"p_start_at": string }; Returns: {
              "duration_minutes": number,"end_at": string,"price_amount": number,"service_name": string
            }[]
                           },
"create_appointment":
{ Args: { "p_customer_id": string,"p_notes"?: string,"p_service_id": string,"p_staff_id": string,"p_start_at": string }; Returns: {
              "created_at": string,
"customer_id": string,
"duration_minutes_snapshot": number,
"end_at": string,
"id": string,
"notes": string | null,
"price_amount_snapshot": number,
"service_id": string,
"service_name_snapshot": string,
"staff_id": string,
"start_at": string,
"status": string,
"updated_at": string,
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "appointments"
        isOneToOne: true
        isSetofReturn: false
      } },
"replace_staff_working_hours":
{ Args: { "p_days": Json,"p_staff_id": string }; Returns: undefined
                           },
"reschedule_appointment":
{ Args: { "p_appointment_id": string,"p_notes"?: string,"p_service_id": string,"p_staff_id": string,"p_start_at": string }; Returns: {
              "created_at": string,
"customer_id": string,
"duration_minutes_snapshot": number,
"end_at": string,
"id": string,
"notes": string | null,
"price_amount_snapshot": number,
"service_id": string,
"service_name_snapshot": string,
"staff_id": string,
"start_at": string,
"status": string,
"updated_at": string,
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "appointments"
        isOneToOne: true
        isSetofReturn: false
      } },
"transition_appointment_status":
{ Args: { "p_appointment_id": string,"p_new_status": string }; Returns: {
              "created_at": string,
"customer_id": string,
"duration_minutes_snapshot": number,
"end_at": string,
"id": string,
"notes": string | null,
"price_amount_snapshot": number,
"service_id": string,
"service_name_snapshot": string,
"staff_id": string,
"start_at": string,
"status": string,
"updated_at": string,
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "appointments"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
