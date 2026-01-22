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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      asset_claims: {
        Row: {
          asset_id: string
          claimant_id: string
          claimed_at: string | null
          created_at: string
          id: string
          processed_at: string | null
          processing_notes: string | null
          receipt_storage_path: string | null
          status: Database["public"]["Enums"]["asset_claim_status"]
          updated_at: string
        }
        Insert: {
          asset_id: string
          claimant_id: string
          claimed_at?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          processing_notes?: string | null
          receipt_storage_path?: string | null
          status?: Database["public"]["Enums"]["asset_claim_status"]
          updated_at?: string
        }
        Update: {
          asset_id?: string
          claimant_id?: string
          claimed_at?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          processing_notes?: string | null
          receipt_storage_path?: string | null
          status?: Database["public"]["Enums"]["asset_claim_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_claims_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          account_number: string | null
          asset_type: Database["public"]["Enums"]["asset_type"]
          claim_session_id: string
          currency: string | null
          details: Json | null
          discovered_at: string
          estimated_value: number | null
          id: string
          institution_name: string
        }
        Insert: {
          account_number?: string | null
          asset_type: Database["public"]["Enums"]["asset_type"]
          claim_session_id: string
          currency?: string | null
          details?: Json | null
          discovered_at?: string
          estimated_value?: number | null
          id?: string
          institution_name: string
        }
        Update: {
          account_number?: string | null
          asset_type?: Database["public"]["Enums"]["asset_type"]
          claim_session_id?: string
          currency?: string | null
          details?: Json | null
          discovered_at?: string
          estimated_value?: number | null
          id?: string
          institution_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_claim_session_id_fkey"
            columns: ["claim_session_id"]
            isOneToOne: false
            referencedRelation: "claim_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      claim_sessions: {
        Row: {
          assigned_reviewer_id: string | null
          claimant_id: string
          consent_given: boolean
          consent_timestamp: string | null
          created_at: string
          deceased_id_number: string | null
          deceased_name: string
          id: string
          notes: string | null
          relationship: string
          status: Database["public"]["Enums"]["claim_status"]
          updated_at: string
        }
        Insert: {
          assigned_reviewer_id?: string | null
          claimant_id: string
          consent_given?: boolean
          consent_timestamp?: string | null
          created_at?: string
          deceased_id_number?: string | null
          deceased_name: string
          id?: string
          notes?: string | null
          relationship: string
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
        }
        Update: {
          assigned_reviewer_id?: string | null
          claimant_id?: string
          consent_given?: boolean
          consent_timestamp?: string | null
          created_at?: string
          deceased_id_number?: string | null
          deceased_name?: string
          id?: string
          notes?: string | null
          relationship?: string
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          claim_session_id: string
          document_type: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          ocr_data: Json | null
          ocr_processed_at: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["document_status"]
          storage_path: string
          uploaded_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          claim_session_id: string
          document_type: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          ocr_data?: Json | null
          ocr_processed_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          storage_path: string
          uploaded_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          claim_session_id?: string
          document_type?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          ocr_data?: Json | null
          ocr_processed_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          storage_path?: string
          uploaded_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_claim_session_id_fkey"
            columns: ["claim_session_id"]
            isOneToOne: false
            referencedRelation: "claim_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          claim_session_id: string | null
          created_at: string
          id: string
          message: string
          priority: string | null
          status: string | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          claim_session_id?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          claim_session_id?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_claim_session_id_fkey"
            columns: ["claim_session_id"]
            isOneToOne: false
            referencedRelation: "claim_sessions"
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
      app_role: "CLAIMANT" | "ADMIN" | "REVIEWER"
      asset_claim_status:
        | "DISCOVERED"
        | "CLAIMED"
        | "PROCESSING"
        | "TRANSFERRED"
        | "REJECTED"
      asset_type:
        | "BANK_ACCOUNT"
        | "INVESTMENT"
        | "INSURANCE"
        | "PROPERTY"
        | "LOAN"
        | "OTHER"
      audit_action:
        | "CREATE"
        | "UPDATE"
        | "DELETE"
        | "VIEW"
        | "VERIFY"
        | "APPROVE"
        | "REJECT"
        | "UPLOAD"
        | "LOGIN"
        | "LOGOUT"
      claim_status:
        | "STARTED"
        | "DOCUMENTS_UPLOADED"
        | "UNDER_REVIEW"
        | "VERIFIED"
        | "APPROVED"
        | "REJECTED"
      document_status: "PENDING" | "OCR_COMPLETE" | "VERIFIED" | "REJECTED"
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
      app_role: ["CLAIMANT", "ADMIN", "REVIEWER"],
      asset_claim_status: [
        "DISCOVERED",
        "CLAIMED",
        "PROCESSING",
        "TRANSFERRED",
        "REJECTED",
      ],
      asset_type: [
        "BANK_ACCOUNT",
        "INVESTMENT",
        "INSURANCE",
        "PROPERTY",
        "LOAN",
        "OTHER",
      ],
      audit_action: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "VIEW",
        "VERIFY",
        "APPROVE",
        "REJECT",
        "UPLOAD",
        "LOGIN",
        "LOGOUT",
      ],
      claim_status: [
        "STARTED",
        "DOCUMENTS_UPLOADED",
        "UNDER_REVIEW",
        "VERIFIED",
        "APPROVED",
        "REJECTED",
      ],
      document_status: ["PENDING", "OCR_COMPLETE", "VERIFIED", "REJECTED"],
    },
  },
} as const
