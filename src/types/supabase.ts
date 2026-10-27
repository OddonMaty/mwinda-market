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
      countries: {
        Row: {
          code: string
          currency_code: string
          currency_symbol: string
          default_language: string | null
          flag: string | null
          name_en: string
          name_fr: string
          phone_code: string | null
        }
        Insert: {
          code: string
          currency_code: string
          currency_symbol: string
          default_language?: string | null
          flag?: string | null
          name_en: string
          name_fr: string
          phone_code?: string | null
        }
        Update: {
          code?: string
          currency_code?: string
          currency_symbol?: string
          default_language?: string | null
          flag?: string | null
          name_en?: string
          name_fr?: string
          phone_code?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          image: string | null
          order_id: string
          product_id: string | null
          quantity: number
          shop_id: string | null
          title: string
          unit_usd_price: number
        }
        Insert: {
          id?: string
          image?: string | null
          order_id: string
          product_id?: string | null
          quantity: number
          shop_id?: string | null
          title: string
          unit_usd_price: number
        }
        Update: {
          id?: string
          image?: string | null
          order_id?: string
          product_id?: string | null
          quantity?: number
          shop_id?: string | null
          title?: string
          unit_usd_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_usd: number
          country_code: string
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_city: string | null
          delivery_province: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payment_external_id: string | null
          payment_method: string | null
          payment_provider: string | null
          payment_status: string
          reference: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount_usd: number
          country_code?: string
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_city?: string | null
          delivery_province?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_external_id?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string
          reference: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount_usd?: number
          country_code?: string
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: string
          delivery_city?: string | null
          delivery_province?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_external_id?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string
          reference?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          id?: string
          product_id: string
          sort_order?: number | null
          url: string
        }
        Update: {
          id?: string
          product_id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          author: string
          city: string | null
          comment: string | null
          created_at: string | null
          id: string
          is_demo: boolean
          product_id: string
          rating: number
          review_date: string | null
          verified_purchase: boolean | null
        }
        Insert: {
          author: string
          city?: string | null
          comment?: string | null
          created_at?: string | null
          id: string
          is_demo?: boolean
          product_id: string
          rating: number
          review_date?: string | null
          verified_purchase?: boolean | null
        }
        Update: {
          author?: string
          city?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_demo?: boolean
          product_id?: string
          rating?: number
          review_date?: string | null
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badge_discount: string | null
          badge_logistics: string | null
          badge_logistics_text: string | null
          category: string
          created_at: string | null
          description: string | null
          features: string[] | null
          id: string
          image: string
          in_stock: boolean | null
          is_active: boolean | null
          is_demo: boolean
          original_usd_price: number | null
          province: string
          rating: number | null
          review_count: number | null
          shop_id: string
          specifications: Json | null
          stock_count: number | null
          title: string
          updated_at: string | null
          usd_price: number
        }
        Insert: {
          badge_discount?: string | null
          badge_logistics?: string | null
          badge_logistics_text?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id: string
          image: string
          in_stock?: boolean | null
          is_active?: boolean | null
          is_demo?: boolean
          original_usd_price?: number | null
          province: string
          rating?: number | null
          review_count?: number | null
          shop_id: string
          specifications?: Json | null
          stock_count?: number | null
          title: string
          updated_at?: string | null
          usd_price: number
        }
        Update: {
          badge_discount?: string | null
          badge_logistics?: string | null
          badge_logistics_text?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          image?: string
          in_stock?: boolean | null
          is_active?: boolean | null
          is_demo?: boolean
          original_usd_price?: number | null
          province?: string
          rating?: number | null
          review_count?: number | null
          shop_id?: string
          specifications?: Json | null
          stock_count?: number | null
          title?: string
          updated_at?: string | null
          usd_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          capital: string | null
          country_code: string
          delay: string | null
          hub: string | null
          id: string
          is_express: boolean | null
          name: string
          zone: string | null
        }
        Insert: {
          capital?: string | null
          country_code: string
          delay?: string | null
          hub?: string | null
          id: string
          is_express?: boolean | null
          name: string
          zone?: string | null
        }
        Update: {
          capital?: string | null
          country_code?: string
          delay?: string | null
          hub?: string | null
          id?: string
          is_express?: boolean | null
          name?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regions_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      seller_applications: {
        Row: {
          category: string | null
          country_code: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          location: string | null
          notes: string | null
          phone: string
          shop_name: string
          status: string
        }
        Insert: {
          category?: string | null
          country_code?: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          location?: string | null
          notes?: string | null
          phone: string
          shop_name: string
          status?: string
        }
        Update: {
          category?: string | null
          country_code?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          location?: string | null
          notes?: string | null
          phone?: string
          shop_name?: string
          status?: string
        }
        Relationships: []
      }
      shops: {
        Row: {
          banner_image: string | null
          bio: string | null
          category: string | null
          city: string
          country_code: string
          covered_territories: string | null
          created_at: string | null
          featured: boolean | null
          full_address: string | null
          id: string
          is_active: boolean | null
          is_demo: boolean
          logo_image: string | null
          name: string
          opening_hours: string | null
          performance_communication: number | null
          performance_item_quality: number | null
          performance_overall: string | null
          performance_shipping: number | null
          phone: string | null
          province: string
          rating: number | null
          response_rate: string | null
          review_count: number | null
          shipping_speed: string | null
          specialties: string[] | null
          tagline: string | null
          top_seller: boolean | null
          updated_at: string | null
          verified: boolean | null
          whatsapp: string | null
          year_established: string | null
        }
        Insert: {
          banner_image?: string | null
          bio?: string | null
          category?: string | null
          city: string
          country_code?: string
          covered_territories?: string | null
          created_at?: string | null
          featured?: boolean | null
          full_address?: string | null
          id: string
          is_active?: boolean | null
          is_demo?: boolean
          logo_image?: string | null
          name: string
          opening_hours?: string | null
          performance_communication?: number | null
          performance_item_quality?: number | null
          performance_overall?: string | null
          performance_shipping?: number | null
          phone?: string | null
          province: string
          rating?: number | null
          response_rate?: string | null
          review_count?: number | null
          shipping_speed?: string | null
          specialties?: string[] | null
          tagline?: string | null
          top_seller?: boolean | null
          updated_at?: string | null
          verified?: boolean | null
          whatsapp?: string | null
          year_established?: string | null
        }
        Update: {
          banner_image?: string | null
          bio?: string | null
          category?: string | null
          city?: string
          country_code?: string
          covered_territories?: string | null
          created_at?: string | null
          featured?: boolean | null
          full_address?: string | null
          id?: string
          is_active?: boolean | null
          is_demo?: boolean
          logo_image?: string | null
          name?: string
          opening_hours?: string | null
          performance_communication?: number | null
          performance_item_quality?: number | null
          performance_overall?: string | null
          performance_shipping?: number | null
          phone?: string | null
          province?: string
          rating?: number | null
          response_rate?: string | null
          review_count?: number | null
          shipping_speed?: string | null
          specialties?: string[] | null
          tagline?: string | null
          top_seller?: boolean | null
          updated_at?: string | null
          verified?: boolean | null
          whatsapp?: string | null
          year_established?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shops_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      vendors: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role: string | null
          settlement_currency: string | null
          settlement_method: string | null
          shop_id: string
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          role?: string | null
          settlement_currency?: string | null
          settlement_method?: string | null
          shop_id: string
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: string | null
          settlement_currency?: string | null
          settlement_method?: string | null
          shop_id?: string
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_reference: { Args: never; Returns: string }
      is_vendor: { Args: never; Returns: boolean }
      is_vendor_of_shop: { Args: { p_shop_id: string }; Returns: boolean }
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
