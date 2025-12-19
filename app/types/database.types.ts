export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      pomodoros: {
        Row: {
          created_at: string
          cycle: number | null
          expected_duration: number
          expected_end: string | null
          finished_at: string | null
          id: number
          started_at: string | null
          state: Database["public"]["Enums"]["pomodoro-state"]
          timelapse: number
          toggle_timeline: Json | null
          type: Database["public"]["Enums"]["pomodoro-type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle?: number | null
          expected_duration?: number
          expected_end?: string | null
          finished_at?: string | null
          id?: number
          started_at?: string | null
          state?: Database["public"]["Enums"]["pomodoro-state"]
          timelapse?: number
          toggle_timeline?: Json | null
          type?: Database["public"]["Enums"]["pomodoro-type"]
          user_id: string
        }
        Update: {
          created_at?: string
          cycle?: number | null
          expected_duration?: number
          expected_end?: string | null
          finished_at?: string | null
          id?: number
          started_at?: string | null
          state?: Database["public"]["Enums"]["pomodoro-state"]
          timelapse?: number
          toggle_timeline?: Json | null
          type?: Database["public"]["Enums"]["pomodoro-type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoros_cycle_fkey"
            columns: ["cycle"]
            isOneToOne: false
            referencedRelation: "pomodoros_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoros_cycles: {
        Row: {
          created_at: string
          id: number
          required_tags: string[] | null
          state: Database["public"]["Enums"]["pomodoro-state"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          required_tags?: string[] | null
          state?: Database["public"]["Enums"]["pomodoro-state"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          required_tags?: string[] | null
          state?: Database["public"]["Enums"]["pomodoro-state"] | null
          user_id?: string | null
        }
        Relationships: []
      }
      pomodoros_tags: {
        Row: {
          pomodoro: number
          tag: number
          user_id: string | null
        }
        Insert: {
          pomodoro: number
          tag: number
          user_id?: string | null
        }
        Update: {
          pomodoro?: number
          tag?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pomodoros_tags_pomodoro_fkey"
            columns: ["pomodoro"]
            isOneToOne: false
            referencedRelation: "pomodoros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pomodoros_tags_tag_fkey"
            columns: ["tag"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          fullname: string | null
          has_password: boolean | null
          id: string
          settings: Json | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          fullname?: string | null
          has_password?: boolean | null
          id: string
          settings?: Json | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          fullname?: string | null
          has_password?: boolean | null
          id?: string
          settings?: Json | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: number
          label: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          label: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          label?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          archived: boolean | null
          created_at: string | null
          description: string | null
          done: boolean | null
          id: string
          pomodoro_id: number
          tag_id: number
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          created_at?: string | null
          description?: string | null
          done?: boolean | null
          id?: string
          pomodoro_id: number
          tag_id: number
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived?: boolean | null
          created_at?: string | null
          description?: string | null
          done?: boolean | null
          id?: string
          pomodoro_id?: number
          tag_id?: number
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_pomodoro_id_fkey"
            columns: ["pomodoro_id"]
            isOneToOne: false
            referencedRelation: "pomodoros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_finish_expired_pomodoros: { Args: never; Returns: undefined }
      calculate_pomodoro_timelapse_sql: {
        Args: { p_now?: string; p_started_at: string; p_toggle_timeline: Json }
        Returns: number
      }
      is_valid_personal_access_token: { Args: never; Returns: boolean }
    }
    Enums: {
      "pomodoro-state": "current" | "paused" | "finished"
      "pomodoro-type": "focus" | "break" | "long-break"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      "pomodoro-state": ["current", "paused", "finished"],
      "pomodoro-type": ["focus", "break", "long-break"],
    },
  },
} as const

