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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activation_codes: {
        Row: {
          code: string
          created_at: string
          is_active: boolean
          name: string | null
          set_code: string
        }
        Insert: {
          code: string
          created_at?: string
          is_active?: boolean
          name?: string | null
          set_code: string
        }
        Update: {
          code?: string
          created_at?: string
          is_active?: boolean
          name?: string | null
          set_code?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      tasting_notes: {
        Row: {
          created_at: string
          flavors: string[]
          id: string
          intensity_ratings: Json | null
          note: string | null
          rating: number | null
          updated_at: string
          user_id: string
          whisky_id: string
        }
        Insert: {
          created_at?: string
          flavors?: string[]
          id?: string
          intensity_ratings?: Json | null
          note?: string | null
          rating?: number | null
          updated_at?: string
          user_id: string
          whisky_id: string
        }
        Update: {
          created_at?: string
          flavors?: string[]
          id?: string
          intensity_ratings?: Json | null
          note?: string | null
          rating?: number | null
          updated_at?: string
          user_id?: string
          whisky_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasting_notes_whisky_id_fkey"
            columns: ["whisky_id"]
            isOneToOne: false
            referencedRelation: "whiskies"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_sets: {
        Row: {
          activated_at: string
          id: string
          set_code: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          id?: string
          set_code: string
          user_id: string
        }
        Update: {
          activated_at?: string
          id?: string
          set_code?: string
          user_id?: string
        }
        Relationships: []
      }
      whiskies: {
        Row: {
          created_at: string
          distillery: string
          expert_score_floral: number | null
          expert_score_fruit: number | null
          expert_score_oak: number | null
          expert_score_smoke: number | null
          expert_score_spice: number | null
          id: string
          image_url: string | null
          location: string | null
          name: string
          overview: string | null
          pairs_well_with_a: string | null
          pairs_well_with_b: string | null
          pairs_well_with_c: string | null
          region: string
          region_location: string | null
          set_code: string
        }
        Insert: {
          created_at?: string
          distillery: string
          expert_score_floral?: number | null
          expert_score_fruit?: number | null
          expert_score_oak?: number | null
          expert_score_smoke?: number | null
          expert_score_spice?: number | null
          id?: string
          image_url?: string | null
          location?: string | null
          name: string
          overview?: string | null
          pairs_well_with_a?: string | null
          pairs_well_with_b?: string | null
          pairs_well_with_c?: string | null
          region: string
          region_location?: string | null
          set_code?: string
        }
        Update: {
          created_at?: string
          distillery?: string
          expert_score_floral?: number | null
          expert_score_fruit?: number | null
          expert_score_oak?: number | null
          expert_score_smoke?: number | null
          expert_score_spice?: number | null
          id?: string
          image_url?: string | null
          location?: string | null
          name?: string
          overview?: string | null
          pairs_well_with_a?: string | null
          pairs_well_with_b?: string | null
          pairs_well_with_c?: string | null
          region?: string
          region_location?: string | null
          set_code?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          whisky_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          whisky_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          whisky_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_with_code: {
        Args: { _code: string }
        Returns: {
          activated: boolean
          name: string
          set_code: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_flavor_distribution: {
        Args: { _whisky_id: string }
        Returns: {
          count: number
          flavor: string
          percentage: number
        }[]
      }
      get_flavor_percentage: {
        Args: { _flavor: string; _whisky_id: string }
        Returns: number
      }
      get_whisky_recommendations: {
        Args: {
          _floral_score?: number
          _fruit_score?: number
          _limit?: number
          _oak_score?: number
          _smoke_score?: number
          _spice_score?: number
          _user_id: string
        }
        Returns: {
          distillery: string
          expert_score_floral: number
          expert_score_fruit: number
          expert_score_oak: number
          expert_score_smoke: number
          expert_score_spice: number
          image_url: string
          location: string
          name: string
          overview: string
          region: string
          similarity_percentage: number
          similarity_score: number
          whisky_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
