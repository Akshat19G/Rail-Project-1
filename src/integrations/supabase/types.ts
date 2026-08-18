export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      emergencies: {
        Row: {
          ambulance_id: string | null
          ambulance_status: string | null
          assessment: string | null
          assigned_doctor_id: string | null
          assigned_doctor_name: string | null
          blood_group: string | null
          coach: string
          code: string
          created_at: string
          current_station: string
          doctor_coach: string | null
          doctor_distance: number | null
          doctor_specialization: string | null
          emergency_contact: string | null
          emergency_type: string
          escalated: boolean
          hospital_contact: string | null
          hospital_name: string | null
          hospital_notified: boolean
          hospital_station: string | null
          id: string
          passenger_age: number | null
          passenger_id: string
          passenger_name: string
          priority: Database["public"]["Enums"]["rc_priority"]
          resolution: string | null
          seat: string
          status: string
          symptoms: string
          train_id: string
          triage_reason: string | null
          updated_at: string
        }
        Insert: {
          ambulance_id?: string | null
          ambulance_status?: string | null
          assessment?: string | null
          assigned_doctor_id?: string | null
          assigned_doctor_name?: string | null
          blood_group?: string | null
          coach?: string
          code: string
          created_at?: string
          current_station?: string
          doctor_coach?: string | null
          doctor_distance?: number | null
          doctor_specialization?: string | null
          emergency_contact?: string | null
          emergency_type?: string
          escalated?: boolean
          hospital_contact?: string | null
          hospital_name?: string | null
          hospital_notified?: boolean
          hospital_station?: string | null
          id?: string
          passenger_age?: number | null
          passenger_id: string
          passenger_name?: string
          priority?: Database["public"]["Enums"]["rc_priority"]
          resolution?: string | null
          seat?: string
          status?: string
          symptoms?: string
          train_id?: string
          triage_reason?: string | null
          updated_at?: string
        }
        Update: {
          ambulance_id?: string | null
          ambulance_status?: string | null
          assessment?: string | null
          assigned_doctor_id?: string | null
          assigned_doctor_name?: string | null
          blood_group?: string | null
          coach?: string
          code?: string
          created_at?: string
          current_station?: string
          doctor_coach?: string | null
          doctor_distance?: number | null
          doctor_specialization?: string | null
          emergency_contact?: string | null
          emergency_type?: string
          escalated?: boolean
          hospital_contact?: string | null
          hospital_name?: string | null
          hospital_notified?: boolean
          hospital_station?: string | null
          id?: string
          passenger_age?: number | null
          passenger_id?: string
          passenger_name?: string
          priority?: Database["public"]["Enums"]["rc_priority"]
          resolution?: string | null
          seat?: string
          status?: string
          symptoms?: string
          train_id?: string
          triage_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      emergency_events: {
        Row: {
          actor: string
          created_at: string
          detail: string | null
          emergency_id: string
          event_type: string
          icon: string | null
          id: string
        }
        Insert: {
          actor?: string
          created_at?: string
          detail?: string | null
          emergency_id: string
          event_type: string
          icon?: string | null
          id?: string
        }
        Update: {
          actor?: string
          created_at?: string
          detail?: string | null
          emergency_id?: string
          event_type?: string
          icon?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_events_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergencies"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_reports: {
        Row: {
          created_at: string
          description: string
          emergency_code: string
          emergency_id: string | null
          id: string
          reason: string
          reported_user_id: string | null
          reporter_id: string
          reporter_role: Database["public"]["Enums"]["rc_role"]
          resolution: string | null
          review_result: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description?: string
          emergency_code?: string
          emergency_id?: string | null
          id?: string
          reason: string
          reported_user_id?: string | null
          reporter_id: string
          reporter_role?: Database["public"]["Enums"]["rc_role"]
          resolution?: string | null
          review_result?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          description?: string
          emergency_code?: string
          emergency_id?: string | null
          id?: string
          reason?: string
          reported_user_id?: string | null
          reporter_id?: string
          reporter_role?: Database["public"]["Enums"]["rc_role"]
          resolution?: string | null
          review_result?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_reports_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergencies"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string
          ambulance_available: boolean
          ambulance_id: string
          contact: string
          created_at: string
          id: string
          name: string
          station: string
          status: string
          type: string
        }
        Insert: {
          address?: string
          ambulance_available?: boolean
          ambulance_id?: string
          contact?: string
          created_at?: string
          id?: string
          name: string
          station: string
          status?: string
          type?: string
        }
        Update: {
          address?: string
          ambulance_available?: boolean
          ambulance_id?: string
          contact?: string
          created_at?: string
          id?: string
          name?: string
          station?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      journeys: {
        Row: {
          available: boolean
          coach: string
          created_at: string
          from_station: string
          id: string
          role: Database["public"]["Enums"]["rc_role"]
          seat: string
          to_station: string
          train_id: string
          train_name: string
          travel_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          available?: boolean
          coach?: string
          created_at?: string
          from_station?: string
          id?: string
          role?: Database["public"]["Enums"]["rc_role"]
          seat?: string
          to_station?: string
          train_id?: string
          train_name?: string
          travel_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          available?: boolean
          coach?: string
          created_at?: string
          from_station?: string
          id?: string
          role?: Database["public"]["Enums"]["rc_role"]
          seat?: string
          to_station?: string
          train_id?: string
          train_name?: string
          travel_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          allergies: string | null
          blood_group: string | null
          created_at: string
          email: string | null
          emergency_contact: string | null
          full_name: string
          id: string
          is_responder: boolean
          mobile: string | null
          role: Database["public"]["Enums"]["rc_role"]
          specialization: string | null
          trust_score: number
          updated_at: string
        }
        Insert: {
          age?: number | null
          allergies?: string | null
          blood_group?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          full_name?: string
          id: string
          is_responder?: boolean
          mobile?: string | null
          role?: Database["public"]["Enums"]["rc_role"]
          specialization?: string | null
          trust_score?: number
          updated_at?: string
        }
        Update: {
          age?: number | null
          allergies?: string | null
          blood_group?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          full_name?: string
          id?: string
          is_responder?: boolean
          mobile?: string | null
          role?: Database["public"]["Enums"]["rc_role"]
          specialization?: string | null
          trust_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      redeemed_rewards: {
        Row: {
          code: string
          cost: number
          created_at: string
          detail: string
          id: string
          name: string
          reward_id: string
          user_id: string
        }
        Insert: {
          code: string
          cost: number
          created_at?: string
          detail?: string
          id?: string
          name: string
          reward_id: string
          user_id: string
        }
        Update: {
          code?: string
          cost?: number
          created_at?: string
          detail?: string
          id?: string
          name?: string
          reward_id?: string
          user_id?: string
        }
        Relationships: []
      }
      reward_transactions: {
        Row: {
          created_at: string
          id: string
          kind: string
          label: string
          points: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          label: string
          points: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          label?: string
          points?: number
          user_id?: string
        }
        Relationships: []
      }
      train_state: {
        Row: {
          current_station_index: number
          journey_status: string
          running: boolean
          train_id: string
          train_name: string
          updated_at: string
        }
        Insert: {
          current_station_index?: number
          journey_status?: string
          running?: boolean
          train_id: string
          train_name?: string
          updated_at?: string
        }
        Update: {
          current_station_index?: number
          journey_status?: string
          running?: boolean
          train_id?: string
          train_name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      rc_priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
      rc_role: "passenger" | "doctor" | "hospital" | "control"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      rc_priority: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      rc_role: ["passenger", "doctor", "hospital", "control"],
    },
  },
} as const
