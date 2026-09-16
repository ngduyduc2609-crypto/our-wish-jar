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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          added_by: string | null
          category: string
          created_at: string
          done: boolean
          done_at: string | null
          id: string
          image_pos: string
          image_url: string | null
          name: string
          note: string | null
          place: string | null
          tags: string[]
        }
        Insert: {
          added_by?: string | null
          category?: string
          created_at?: string
          done?: boolean
          done_at?: string | null
          id?: string
          image_pos?: string
          image_url?: string | null
          name: string
          note?: string | null
          place?: string | null
          tags?: string[]
        }
        Update: {
          added_by?: string | null
          category?: string
          created_at?: string
          done?: boolean
          done_at?: string | null
          id?: string
          image_pos?: string
          image_url?: string | null
          name?: string
          note?: string | null
          place?: string | null
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "activities_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: string
          created_at: string
          id: string
          member_id: string | null
          subject: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          member_id?: string | null
          subject?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          member_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_presence: {
        Row: {
          created_at: string
          day: string
          member_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          member_id: string
        }
        Update: {
          created_at?: string
          day?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_presence_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          added_by: string | null
          address: string | null
          created_at: string
          id: string
          image_pos: string
          image_url: string | null
          name: string
          note: string | null
          place: string | null
          price_level: number
          rating: number | null
          tried: boolean
          tried_at: string | null
        }
        Insert: {
          added_by?: string | null
          address?: string | null
          created_at?: string
          id?: string
          image_pos?: string
          image_url?: string | null
          name: string
          note?: string | null
          place?: string | null
          price_level?: number
          rating?: number | null
          tried?: boolean
          tried_at?: string | null
        }
        Update: {
          added_by?: string | null
          address?: string | null
          created_at?: string
          id?: string
          image_pos?: string
          image_url?: string | null
          name?: string
          note?: string | null
          place?: string | null
          price_level?: number
          rating?: number | null
          tried?: boolean
          tried_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foods_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          color: string
          created_at: string
          emoji: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      memories: {
        Row: {
          created_at: string
          created_by: string | null
          happened_on: string
          id: string
          image_pos: string
          image_url: string | null
          note: string | null
          rating: number | null
          source_id: string | null
          source_type: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          happened_on?: string
          id?: string
          image_pos?: string
          image_url?: string | null
          note?: string | null
          rating?: number | null
          source_id?: string | null
          source_type?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          happened_on?: string
          id?: string
          image_pos?: string
          image_url?: string | null
          note?: string | null
          rating?: number | null
          source_id?: string | null
          source_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      wish_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          member_id: string
          wish_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          member_id: string
          wish_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          member_id?: string
          wish_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wish_comments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wish_comments_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: false
            referencedRelation: "wishes"
            referencedColumns: ["id"]
          },
        ]
      }
      wish_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          member_id: string
          wish_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          member_id: string
          wish_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          member_id?: string
          wish_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wish_reactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wish_reactions_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: false
            referencedRelation: "wishes"
            referencedColumns: ["id"]
          },
        ]
      }
      wishes: {
        Row: {
          category: string
          completed: boolean
          completed_at: string | null
          created_at: string
          deadline: string | null
          difficulty: string
          id: string
          note: string | null
          proposed_by: string | null
          title: string
        }
        Insert: {
          category?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          difficulty?: string
          id?: string
          note?: string | null
          proposed_by?: string | null
          title: string
        }
        Update: {
          category?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          difficulty?: string
          id?: string
          note?: string | null
          proposed_by?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishes_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
