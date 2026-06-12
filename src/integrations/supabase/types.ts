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
          artist_profile_id: string | null
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          includes_merch: boolean
          is_active: boolean
          key_code: string
          key_name: string | null
        }
        Insert: {
          access_type: string
          artist_profile_id?: string | null
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          includes_merch?: boolean
          is_active?: boolean
          key_code: string
          key_name?: string | null
        }
        Update: {
          access_type?: string
          artist_profile_id?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          includes_merch?: boolean
          is_active?: boolean
          key_code?: string
          key_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_keys_artist_profile_id_fkey"
            columns: ["artist_profile_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          page_url: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          page_url?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          page_url?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          accept_investments: boolean
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
          accept_investments?: boolean
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
          accept_investments?: boolean
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
      analytics_events: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          event_data: Json | null
          event_type: string
          id: string
          page_url: string | null
          referrer: string | null
          user_id: string | null
          user_session_id: string | null
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          page_url?: string | null
          referrer?: string | null
          user_id?: string | null
          user_session_id?: string | null
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          page_url?: string | null
          referrer?: string | null
          user_id?: string | null
          user_session_id?: string | null
        }
        Relationships: []
      }
      artist_profiles: {
        Row: {
          banner_image_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_public: boolean
          profile_image_url: string | null
          require_key: boolean
          social_links: Json | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          banner_image_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_public?: boolean
          profile_image_url?: string | null
          require_key?: boolean
          social_links?: Json | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          banner_image_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_public?: boolean
          profile_image_url?: string | null
          require_key?: boolean
          social_links?: Json | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      artist_sales: {
        Row: {
          artist_amount: number
          artist_user_id: string
          artist_username: string
          created_at: string
          currency: string
          customer_email: string | null
          gross_amount: number
          id: string
          payout_id: string | null
          platform_fee: number
          product_title: string
          quantity: number
          shopify_line_item_id: string
          shopify_order_id: string
          shopify_product_id: string | null
          status: string
        }
        Insert: {
          artist_amount: number
          artist_user_id: string
          artist_username: string
          created_at?: string
          currency?: string
          customer_email?: string | null
          gross_amount: number
          id?: string
          payout_id?: string | null
          platform_fee: number
          product_title: string
          quantity?: number
          shopify_line_item_id: string
          shopify_order_id: string
          shopify_product_id?: string | null
          status?: string
        }
        Update: {
          artist_amount?: number
          artist_user_id?: string
          artist_username?: string
          created_at?: string
          currency?: string
          customer_email?: string | null
          gross_amount?: number
          id?: string
          payout_id?: string | null
          platform_fee?: number
          product_title?: string
          quantity?: number
          shopify_line_item_id?: string
          shopify_order_id?: string
          shopify_product_id?: string | null
          status?: string
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
          video_url: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string
          duration?: string | null
          file_name: string
          file_size?: string | null
          file_url: string
          id?: string
          video_url?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string
          duration?: string | null
          file_name?: string
          file_size?: string | null
          file_url?: string
          id?: string
          video_url?: string | null
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
      data_deletion_requests: {
        Row: {
          id: string
          processed_at: string | null
          processed_by: string | null
          request_type: string
          requested_at: string | null
          status: string | null
          user_email: string
          user_id: string | null
        }
        Insert: {
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          request_type: string
          requested_at?: string | null
          status?: string | null
          user_email: string
          user_id?: string | null
        }
        Update: {
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          request_type?: string
          requested_at?: string | null
          status?: string | null
          user_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      investment_sessions: {
        Row: {
          created_at: string
          email: string
          id: string
          last_accessed: string
          session_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_accessed?: string
          session_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_accessed?: string
          session_id?: string
        }
        Relationships: []
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
      merch_items: {
        Row: {
          artist_id: string
          created_at: string
          description: string | null
          external_link: string | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          description?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          description?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merch_items_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_accounts: {
        Row: {
          charges_enabled: boolean
          created_at: string
          details_submitted: boolean
          id: string
          payouts_enabled: boolean
          stripe_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          charges_enabled?: boolean
          created_at?: string
          details_submitted?: boolean
          id?: string
          payouts_enabled?: boolean
          stripe_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          charges_enabled?: boolean
          created_at?: string
          details_submitted?: boolean
          id?: string
          payouts_enabled?: boolean
          stripe_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          error_message: string | null
          id: string
          status: string
          stripe_transfer_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          error_message?: string | null
          id?: string
          status?: string
          stripe_transfer_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          error_message?: string | null
          id?: string
          status?: string
          stripe_transfer_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reserved_names: {
        Row: {
          created_at: string
          kind: string
          name: string
          note: string | null
        }
        Insert: {
          created_at?: string
          kind: string
          name: string
          note?: string | null
        }
        Update: {
          created_at?: string
          kind?: string
          name?: string
          note?: string | null
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
      user_consents: {
        Row: {
          consent_given: boolean
          consent_text: string | null
          consent_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          session_id: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          consent_given?: boolean
          consent_text?: string | null
          consent_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          session_id?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          consent_given?: boolean
          consent_text?: string | null
          consent_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          session_id?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
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
      bootstrap_first_admin: { Args: never; Returns: undefined }
      get_public_admin_settings: {
        Args: { admin_id_param?: string }
        Returns: {
          accept_investments: boolean
          admin_id: string
          cover_art_url: string
          project_name: string
        }[]
      }
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
      resolve_access_key: {
        Args: { key_code_param: string }
        Returns: {
          access_type: string
          artist_profile_id: string
          expires_at: string
          includes_merch: boolean
          is_valid: boolean
          username: string
        }[]
      }
      validate_access_key: {
        Args: { key_code_param: string }
        Returns: {
          access_type: string
          expires_at: string
          is_valid: boolean
        }[]
      }
      validate_artist_key: {
        Args: { artist_profile_id_param: string; key_code_param: string }
        Returns: {
          access_type: string
          expires_at: string
          includes_merch: boolean
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
