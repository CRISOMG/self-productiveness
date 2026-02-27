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
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body: string
          created_at: string
          icon: string | null
          id: string
          link: string | null
          name: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          icon?: string | null
          id?: string
          link?: string | null
          name: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          icon?: string | null
          id?: string
          link?: string | null
          name?: string
          title?: string
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
          state: Database["public"]["Enums"]["pomodoro_state"]
          timelapse: number
          toggle_timeline: Json | null
          type: Database["public"]["Enums"]["pomodoro_type"]
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
          state?: Database["public"]["Enums"]["pomodoro_state"]
          timelapse?: number
          toggle_timeline?: Json | null
          type?: Database["public"]["Enums"]["pomodoro_type"]
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
          state?: Database["public"]["Enums"]["pomodoro_state"]
          timelapse?: number
          toggle_timeline?: Json | null
          type?: Database["public"]["Enums"]["pomodoro_type"]
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
          state: Database["public"]["Enums"]["pomodoro_state"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          required_tags?: string[] | null
          state?: Database["public"]["Enums"]["pomodoro_state"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          required_tags?: string[] | null
          state?: Database["public"]["Enums"]["pomodoro_state"] | null
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
      pomodoros_tasks: {
        Row: {
          created_at: string
          id: number
          pomodoro_id: number
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          pomodoro_id: number
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          pomodoro_id?: number
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoros_tasks_pomodoro_id_fkey"
            columns: ["pomodoro_id"]
            isOneToOne: false
            referencedRelation: "pomodoros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pomodoros_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
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
      push_subscriptions: {
        Row: {
          created_at: string | null
          device_info: string | null
          id: string
          subscription: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: string | null
          id?: string
          subscription: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: string | null
          id?: string
          subscription?: Json
          user_id?: string
        }
        Relationships: []
      }
      scheduled_notifications: {
        Row: {
          created_at: string
          id: string
          last_executed_at: string | null
          payload_override: Json | null
          rrule: string | null
          scheduled_at: string
          status: string
          template_id: string | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_executed_at?: string | null
          payload_override?: Json | null
          rrule?: string | null
          scheduled_at: string
          status?: string
          template_id?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_executed_at?: string | null
          payload_override?: Json | null
          rrule?: string | null
          scheduled_at?: string
          status?: string
          template_id?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_notifications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
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
      task_templates: {
        Row: {
          created_at: string
          default_description: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_description?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_description?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      task_templates_tags: {
        Row: {
          tag_id: number
          template_id: string
        }
        Insert: {
          tag_id: number
          template_id: string
        }
        Update: {
          tag_id?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_tags_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived: boolean | null
          created_at: string | null
          description: string | null
          done: boolean | null
          done_at: string | null
          id: string
          keep: boolean | null
          pomodoro_id: number | null
          stage: Database["public"]["Enums"]["task_stage"] | null
          tag_id: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          created_at?: string | null
          description?: string | null
          done?: boolean | null
          done_at?: string | null
          id?: string
          keep?: boolean | null
          pomodoro_id?: number | null
          stage?: Database["public"]["Enums"]["task_stage"] | null
          tag_id?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived?: boolean | null
          created_at?: string | null
          description?: string | null
          done?: boolean | null
          done_at?: string | null
          id?: string
          keep?: boolean | null
          pomodoro_id?: number | null
          stage?: Database["public"]["Enums"]["task_stage"] | null
          tag_id?: number | null
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
      tasks_tags: {
        Row: {
          tag: number
          task: string
          user_id: string | null
        }
        Insert: {
          tag: number
          task: string
          user_id?: string | null
        }
        Update: {
          tag?: number
          task?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_tags_tag_fkey"
            columns: ["tag"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_tags_task_fkey"
            columns: ["task"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_secrets: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          iv: string
          key_value: string
          name: string
          tag: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          iv: string
          key_value: string
          name: string
          tag: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          iv?: string
          key_value?: string
          name?: string
          tag?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      webhook_trace: {
        Row: {
          id: number
          net_request_id: number | null
          pgmq_msg_id: number | null
          processed_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: number
          net_request_id?: number | null
          pgmq_msg_id?: number | null
          processed_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: number
          net_request_id?: number | null
          pgmq_msg_id?: number | null
          processed_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_webhook_status: {
        Row: {
          enqueued_at: string | null
          error_msg: string | null
          event_type: string | null
          full_payload: Json | null
          msg_id: number | null
          processed_at: string | null
          response_body: string | null
          status_code: number | null
          target_url: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_finish_expired_pomodoros: { Args: never; Returns: undefined }
      calculate_pomodoro_timelapse_sql:
        | {
            Args: {
              p_expected_duration: number
              p_now?: string
              p_started_at: string
              p_toggle_timeline: Json
            }
            Returns: number
          }
        | {
            Args: {
              p_now?: string
              p_started_at: string
              p_toggle_timeline: Json
            }
            Returns: number
          }
      is_valid_personal_access_token: { Args: never; Returns: boolean }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      process_webhooks: { Args: never; Returns: undefined }
      supabase_url: { Args: never; Returns: string }
    }
    Enums: {
      pomodoro_state: "current" | "paused" | "finished" | "skipped"
      pomodoro_type: "focus" | "break" | "long-break"
      task_stage: "backlog" | "to_do" | "in_progress" | "done" | "archived"
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
      pomodoro_state: ["current", "paused", "finished", "skipped"],
      pomodoro_type: ["focus", "break", "long-break"],
      task_stage: ["backlog", "to_do", "in_progress", "done", "archived"],
    },
  },
} as const
