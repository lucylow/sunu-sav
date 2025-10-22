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
      contributions: {
        Row: {
          amount: number
          created_at: string | null
          cycle: number
          group_id: string
          id: string
          payment_hash: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          cycle: number
          group_id: string
          id?: string
          payment_hash?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          cycle?: number
          group_id?: string
          id?: string
          payment_hash?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tontine_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lightning_invoices: {
        Row: {
          amount: number
          created_at: string | null
          expires_at: string
          group_id: string | null
          id: string
          payment_hash: string
          payment_request: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          expires_at: string
          group_id?: string | null
          id?: string
          payment_hash: string
          payment_request: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          expires_at?: string
          group_id?: string | null
          id?: string
          payment_hash?: string
          payment_request?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lightning_invoices_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tontine_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lightning_invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string | null
          cycle: number
          group_id: string
          id: string
          recipient_id: string
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          cycle: number
          group_id: string
          id?: string
          recipient_id: string
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          cycle?: number
          group_id?: string
          id?: string
          recipient_id?: string
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tontine_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          last_signed_in: string | null
          login_method: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          last_signed_in?: string | null
          login_method?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          last_signed_in?: string | null
          login_method?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tontine_groups: {
        Row: {
          contribution_amount: number
          created_at: string | null
          created_by: string | null
          current_cycle: number | null
          description: string | null
          frequency: string
          id: string
          max_members: number
          multi_sig_address: string | null
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contribution_amount: number
          created_at?: string | null
          created_by?: string | null
          current_cycle?: number | null
          description?: string | null
          frequency: string
          id?: string
          max_members: number
          multi_sig_address?: string | null
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contribution_amount?: number
          created_at?: string | null
          created_by?: string | null
          current_cycle?: number | null
          description?: string | null
          frequency?: string
          id?: string
          max_members?: number
          multi_sig_address?: string | null
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tontine_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tontine_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tontine_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      // Senegal-specific tables
      wave_transactions: {
        Row: {
          id: string
          user_id: string
          phone_number: string
          amount_xof: number
          amount_sats: number
          wave_transaction_id: string | null
          status: 'pending' | 'completed' | 'failed'
          reference: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          phone_number: string
          amount_xof: number
          amount_sats: number
          wave_transaction_id?: string | null
          status?: 'pending' | 'completed' | 'failed'
          reference?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          phone_number?: string
          amount_xof?: number
          amount_sats?: number
          wave_transaction_id?: string | null
          status?: 'pending' | 'completed' | 'failed'
          reference?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wave_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ussd_sessions: {
        Row: {
          id: string
          phone_number: string
          session_id: string
          menu_state: string
          user_data: any | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          phone_number: string
          session_id: string
          menu_state?: string
          user_data?: any | null
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          phone_number?: string
          session_id?: string
          menu_state?: string
          user_data?: any | null
          expires_at?: string
          created_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: 'standard' | 'pro' | 'enterprise'
          recurring_xof: number
          active: boolean
          started_at: string
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier?: 'standard' | 'pro' | 'enterprise'
          recurring_xof?: number
          active?: boolean
          started_at?: string
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier?: 'standard' | 'pro' | 'enterprise'
          recurring_xof?: number
          active?: boolean
          started_at?: string
          expires_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_records: {
        Row: {
          id: string
          cycle_id: string | null
          sats_fee: number
          sats_to_partner: number
          sats_to_community: number
          sats_to_platform: number
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cycle_id?: string | null
          sats_fee: number
          sats_to_partner?: number
          sats_to_community?: number
          sats_to_platform?: number
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cycle_id?: string | null
          sats_fee?: number
          sats_to_partner?: number
          sats_to_community?: number
          sats_to_platform?: number
          reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_records_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "tontine_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          id: string
          currency_pair: string
          rate: number
          source: string
          timestamp: string
        }
        Insert: {
          id?: string
          currency_pair: string
          rate: number
          source: string
          timestamp?: string
        }
        Update: {
          id?: string
          currency_pair?: string
          rate?: number
          source?: string
          timestamp?: string
        }
        Relationships: []
      }
      senegal_holidays: {
        Row: {
          id: string
          date: string
          name: string
          is_recurring: boolean
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          name: string
          is_recurring?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          name?: string
          is_recurring?: boolean
          created_at?: string
        }
        Relationships: []
      }
      community_fund: {
        Row: {
          id: string
          total_sats: number
          total_xof: number
          last_distribution: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          total_sats?: number
          total_xof?: number
          last_distribution?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          total_sats?: number
          total_xof?: number
          last_distribution?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_business_day_in_senegal: {
        Args: {
          check_date: string
        }
        Returns: boolean
      }
      get_next_business_day_in_senegal: {
        Args: {
          start_date: string
        }
        Returns: string
      }
      calculate_fee_breakdown: {
        Args: {
          payout_sats: number
          group_verified?: boolean
          user_recurring?: boolean
        }
        Returns: {
          sats_fee: number
          platform_share: number
          community_share: number
          partner_reserved: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
