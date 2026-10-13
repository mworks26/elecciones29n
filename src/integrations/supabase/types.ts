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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      change_log: {
        Row: {
          action: string
          changed_by: string | null
          changes: Json | null
          created_at: string
          entity: string
          entity_id: string
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          changed_by?: string | null
          changes?: Json | null
          created_at?: string
          entity: string
          entity_id: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          changed_by?: string | null
          changes?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      claims: {
        Row: {
          checked_at: string | null
          claim_text: string
          evidence_type: string
          id: string
          page_or_section: string | null
          party_id: string
          position: string
          published_topic: string | null
          quote_or_paraphrase: string | null
          review_status: string
          source_id: string | null
          source_url: string | null
          title: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          checked_at?: string | null
          claim_text: string
          evidence_type: string
          id?: string
          page_or_section?: string | null
          party_id: string
          position?: string
          published_topic?: string | null
          quote_or_paraphrase?: string | null
          review_status?: string
          source_id?: string | null
          source_url?: string | null
          title: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          checked_at?: string | null
          claim_text?: string
          evidence_type?: string
          id?: string
          page_or_section?: string | null
          party_id?: string
          position?: string
          published_topic?: string | null
          quote_or_paraphrase?: string | null
          review_status?: string
          source_id?: string | null
          source_url?: string | null
          title?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
          candidacy_source_id: string | null
          candidate_status: string
          id: string
          last_checked: string | null
          name: string
          notes: string | null
          official_site: string | null
          programme_2026_status: string
          programme_archive: string | null
          short_name: string | null
          updated_at: string
        }
        Insert: {
          candidacy_source_id?: string | null
          candidate_status?: string
          id: string
          last_checked?: string | null
          name: string
          notes?: string | null
          official_site?: string | null
          programme_2026_status?: string
          programme_archive?: string | null
          short_name?: string | null
          updated_at?: string
        }
        Update: {
          candidacy_source_id?: string | null
          candidate_status?: string
          id?: string
          last_checked?: string | null
          name?: string
          notes?: string | null
          official_site?: string | null
          programme_2026_status?: string
          programme_archive?: string | null
          short_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parties_candidacy_source_id_fkey"
            columns: ["candidacy_source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      programme_documents: {
        Row: {
          checked_at: string | null
          created_at: string
          election: string
          id: string
          kind: string
          language: string | null
          party_id: string
          published_at: string | null
          source_id: string | null
          title: string
          url: string
        }
        Insert: {
          checked_at?: string | null
          created_at?: string
          election: string
          id?: string
          kind: string
          language?: string | null
          party_id: string
          published_at?: string | null
          source_id?: string | null
          title: string
          url: string
        }
        Update: {
          checked_at?: string | null
          created_at?: string
          election?: string
          id?: string
          kind?: string
          language?: string | null
          party_id?: string
          published_at?: string | null
          source_id?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "programme_documents_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programme_documents_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          id: string
          last_checked: string | null
          publisher: string | null
          reliability: string | null
          source_type: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          id: string
          last_checked?: string | null
          publisher?: string | null
          reliability?: string | null
          source_type: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          id?: string
          last_checked?: string | null
          publisher?: string | null
          reliability?: string | null
          source_type?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          id: string
          label: string
        }
        Insert: {
          id: string
          label: string
        }
        Update: {
          id?: string
          label?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
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
    Enums: {
      app_role: ["admin"],
    },
  },
} as const
