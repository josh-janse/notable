export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      assessment_embeddings: {
        Row: {
          assessment_result_id: string;
          created_at: string | null;
          embedding: string | null;
          id: string;
        };
        Insert: {
          assessment_result_id: string;
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
        };
        Update: {
          assessment_result_id?: string;
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_embeddings_assessment_result_id_fkey";
            columns: ["assessment_result_id"];
            isOneToOne: true;
            referencedRelation: "assessment_results";
            referencedColumns: ["id"];
          },
        ];
      };
      assessment_results: {
        Row: {
          assessment_date: string | null;
          calculated_score: number | null;
          client_id: string;
          created_at: string | null;
          id: string;
          interpretation: string | null;
          notes: string | null;
          practitioner_id: string;
          responses: Json;
          template_id: string;
        };
        Insert: {
          assessment_date?: string | null;
          calculated_score?: number | null;
          client_id: string;
          created_at?: string | null;
          id?: string;
          interpretation?: string | null;
          notes?: string | null;
          practitioner_id: string;
          responses: Json;
          template_id: string;
        };
        Update: {
          assessment_date?: string | null;
          calculated_score?: number | null;
          client_id?: string;
          created_at?: string | null;
          id?: string;
          interpretation?: string | null;
          notes?: string | null;
          practitioner_id?: string;
          responses?: Json;
          template_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_results_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_results_practitioner_id_fkey";
            columns: ["practitioner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_results_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "assessment_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      assessment_templates: {
        Row: {
          category: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          questions: Json;
          scoring_rules: Json | null;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          questions: Json;
          scoring_rules?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          questions?: Json;
          scoring_rules?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          archived_at: string | null;
          created_at: string | null;
          date_of_birth: string | null;
          email: string | null;
          full_name: string;
          id: string;
          initial_assessment_date: string | null;
          metadata: Json | null;
          notes_summary: string | null;
          phone: string | null;
          practitioner_id: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string | null;
          date_of_birth?: string | null;
          email?: string | null;
          full_name: string;
          id?: string;
          initial_assessment_date?: string | null;
          metadata?: Json | null;
          notes_summary?: string | null;
          phone?: string | null;
          practitioner_id: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string | null;
          date_of_birth?: string | null;
          email?: string | null;
          full_name?: string;
          id?: string;
          initial_assessment_date?: string | null;
          metadata?: Json | null;
          notes_summary?: string | null;
          phone?: string | null;
          practitioner_id?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clients_practitioner_id_fkey";
            columns: ["practitioner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      note_conversations: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          note_id: string;
          role: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          note_id: string;
          role: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          note_id?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "note_conversations_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: false;
            referencedRelation: "notes";
            referencedColumns: ["id"];
          },
        ];
      };
      note_embeddings: {
        Row: {
          created_at: string | null;
          embedding: string | null;
          id: string;
          note_id: string;
        };
        Insert: {
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          note_id: string;
        };
        Update: {
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          note_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "note_embeddings_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: true;
            referencedRelation: "notes";
            referencedColumns: ["id"];
          },
        ];
      };
      note_templates: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          structure: Json;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          structure: Json;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          structure?: Json;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          approved_at: string | null;
          archived_at: string | null;
          client_id: string;
          created_at: string | null;
          duration_minutes: number | null;
          extracted_fields: Json | null;
          follow_up_items: string[] | null;
          id: string;
          markdown_content: string | null;
          next_session_date: string | null;
          practitioner_id: string;
          raw_transcription: string | null;
          session_date: string | null;
          status: string | null;
          template_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          approved_at?: string | null;
          archived_at?: string | null;
          client_id: string;
          created_at?: string | null;
          duration_minutes?: number | null;
          extracted_fields?: Json | null;
          follow_up_items?: string[] | null;
          id?: string;
          markdown_content?: string | null;
          next_session_date?: string | null;
          practitioner_id: string;
          raw_transcription?: string | null;
          session_date?: string | null;
          status?: string | null;
          template_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          approved_at?: string | null;
          archived_at?: string | null;
          client_id?: string;
          created_at?: string | null;
          duration_minutes?: number | null;
          extracted_fields?: Json | null;
          follow_up_items?: string[] | null;
          id?: string;
          markdown_content?: string | null;
          next_session_date?: string | null;
          practitioner_id?: string;
          raw_transcription?: string | null;
          session_date?: string | null;
          status?: string | null;
          template_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notes_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_practitioner_id_fkey";
            columns: ["practitioner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "note_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          client_id: string | null;
          content: Json;
          created_at: string | null;
          id: string;
          note_id: string | null;
          practitioner_id: string;
          title: string;
          type: string;
          viewed: boolean | null;
          viewed_at: string | null;
        };
        Insert: {
          client_id?: string | null;
          content: Json;
          created_at?: string | null;
          id?: string;
          note_id?: string | null;
          practitioner_id: string;
          title: string;
          type: string;
          viewed?: boolean | null;
          viewed_at?: string | null;
        };
        Update: {
          client_id?: string | null;
          content?: Json;
          created_at?: string | null;
          id?: string;
          note_id?: string | null;
          practitioner_id?: string;
          title?: string;
          type?: string;
          viewed?: boolean | null;
          viewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: false;
            referencedRelation: "notes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_practitioner_id_fkey";
            columns: ["practitioner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          first_name: string;
          id: string;
          last_name: string;
          preferences: Json | null;
          timezone: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          first_name: string;
          id: string;
          last_name: string;
          preferences?: Json | null;
          timezone?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          first_name?: string;
          id?: string;
          last_name?: string;
          preferences?: Json | null;
          timezone?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_client_session_progress: {
        Args: { client_uuid: string };
        Returns: {
          avg_duration_minutes: number;
          common_themes: string[];
          first_session_date: string;
          last_session_date: string;
          total_sessions: number;
        }[];
      };
      search_assessments: {
        Args: {
          filter_client_id?: string;
          match_count?: number;
          match_threshold?: number;
          query_embedding: string;
        };
        Returns: {
          assessment_date: string;
          assessment_id: string;
          client_id: string;
          client_name: string;
          interpretation: string;
          similarity: number;
          template_name: string;
        }[];
      };
      search_notes: {
        Args: {
          filter_client_id?: string;
          match_count?: number;
          match_threshold?: number;
          query_embedding: string;
        };
        Returns: {
          client_id: string;
          client_name: string;
          content: string;
          note_id: string;
          session_date: string;
          similarity: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
