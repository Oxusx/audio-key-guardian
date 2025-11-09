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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_keys: {
        Row: {
          access_type: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_code: string
        }
        Insert: {
          access_type: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_code: string
        }
        Update: {
          access_type?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_code?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          admin_id: string
          cover_art_url: string | null
          created_at: string
          id: string
          investment_budget: number | null
          project_name: string | null
          roi_percentage: number | null
          updated_at: string
        }
        Insert: {
          admin_id: string
          cover_art_url?: string | null
          created_at?: string
          id?: string
          investment_budget?: number | null
          project_name?: string | null
          roi_percentage?: number | null
          updated_at?: string
        }
        Update: {
          admin_id?: string
          cover_art_url?: string | null
          created_at?: string
          id?: string
          investment_budget?: number | null
          project_name?: string | null
          roi_percentage?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      audio_files: {
        Row: {
          admin_id: string
          created_at: string
          duration: string | null
          file_name: string
          file_size: string | null
          file_url: string
          id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          duration?: string | null
          file_name: string
          file_size?: string | null
          file_url: string
          id?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          duration?: string | null
          file_name?: string
          file_size?: string | null
          file_url?: string
          id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          admin_email: string
          admin_signed_at: string | null
          contract_date: string
          contract_terms: string
          created_at: string
          expected_return: number
          id: string
          investment_amount: number
          investment_id: string | null
          investor_email: string
          investor_signed_at: string | null
          project_name: string
          roi_percentage: number
        }
        Insert: {
          admin_email: string
          admin_signed_at?: string | null
          contract_date?: string
          contract_terms: string
          created_at?: string
          expected_return: number
          id?: string
          investment_amount: number
          investment_id?: string | null
          investor_email: string
          investor_signed_at?: string | null
          project_name: string
          roi_percentage: number
        }
        Update: {
          admin_email?: string
          admin_signed_at?: string | null
          contract_date?: string
          contract_terms?: string
          created_at?: string
          expected_return?: number
          id?: string
          investment_amount?: number
          investment_id?: string | null
          investor_email?: string
          investor_signed_at?: string | null
          project_name?: string
          roi_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          amount: number
          created_at: string
          id: string
          project_name: string
          user_email: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          project_name: string
          user_email: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          project_name?: string
          user_email?: string
        }
        Relationships: []
      }
      track_likes: {
        Row: {
          created_at: string
          id: string
          track_name: string
          user_session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          track_name: string
          user_session_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          track_name?: string
          user_session_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_total_investments: { Args: never; Returns: number }
      get_track_like_count: {
        Args: { track_name_param: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_user_liked_track: {
        Args: { session_id_param: string; track_name_param: string }
        Returns: boolean
      }
      validate_access_key: {
        Args: { key_code_param: string }
        Returns: {
          access_type: string
          expires_at: string
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
