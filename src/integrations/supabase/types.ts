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
      abuse_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          report_type: string
          reported_message_id: string | null
          reported_user_id: string | null
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          report_type?: string
          reported_message_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          report_type?: string
          reported_message_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      city_interests: {
        Row: {
          city: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      club_members: {
        Row: {
          club_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["club_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_messages: {
        Row: {
          club_id: string
          content: string | null
          created_at: string
          id: string
          media_name: string | null
          media_size: number | null
          media_type: string | null
          media_url: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          club_id: string
          content?: string | null
          created_at?: string
          id?: string
          media_name?: string | null
          media_size?: number | null
          media_type?: string | null
          media_url?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          content?: string | null
          created_at?: string
          id?: string
          media_name?: string | null
          media_size?: number | null
          media_type?: string | null
          media_url?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_messages_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          category: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_private: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          coins: number
          created_at: string
          id: string
          order_id: string | null
          type: Database["public"]["Enums"]["coin_type"]
          user_id: string
        }
        Insert: {
          coins: number
          created_at?: string
          id?: string
          order_id?: string | null
          type: Database["public"]["Enums"]["coin_type"]
          user_id: string
        }
        Update: {
          coins?: number
          created_at?: string
          id?: string
          order_id?: string | null
          type?: Database["public"]["Enums"]["coin_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      media_cleanup_queue: {
        Row: {
          attempts: number
          created_at: string
          file_path: string
          id: string
          last_error: string | null
          processed_at: string | null
          reason: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          file_path: string
          id?: string
          last_error?: string | null
          processed_at?: string | null
          reason?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          file_path?: string
          id?: string
          last_error?: string | null
          processed_at?: string | null
          reason?: string
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          restaurant_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          restaurant_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          restaurant_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          available: boolean
          category_id: string | null
          created_at: string
          description: string | null
          discount_percent: number | null
          id: string
          image_url: string | null
          name: string
          preparation_time_minutes: number
          price: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          available?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          image_url?: string | null
          name: string
          preparation_time_minutes?: number
          price: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          available?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          image_url?: string | null
          name?: string
          preparation_time_minutes?: number
          price?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          delivered_at: string | null
          encrypted_for_sender: string | null
          encrypted_message: string
          id: string
          media_file_path: string | null
          media_filename: string | null
          media_iv: string | null
          media_key: string | null
          media_lifecycle: string
          media_type: string | null
          media_url: string | null
          media_viewed_at: string | null
          read_at: string | null
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          encrypted_for_sender?: string | null
          encrypted_message: string
          id?: string
          media_file_path?: string | null
          media_filename?: string | null
          media_iv?: string | null
          media_key?: string | null
          media_lifecycle?: string
          media_type?: string | null
          media_url?: string | null
          media_viewed_at?: string | null
          read_at?: string | null
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          encrypted_for_sender?: string | null
          encrypted_message?: string
          id?: string
          media_file_path?: string | null
          media_filename?: string | null
          media_iv?: string | null
          media_key?: string | null
          media_lifecycle?: string
          media_type?: string | null
          media_url?: string | null
          media_viewed_at?: string | null
          read_at?: string | null
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          earning_notifications: boolean
          id: string
          message_notifications: boolean
          order_notifications: boolean
          push_notifications: boolean
          social_notifications: boolean
          sound_enabled: boolean
          updated_at: string
          user_id: string
          vibration_enabled: boolean
        }
        Insert: {
          created_at?: string
          earning_notifications?: boolean
          id?: string
          message_notifications?: boolean
          order_notifications?: boolean
          push_notifications?: boolean
          social_notifications?: boolean
          sound_enabled?: boolean
          updated_at?: string
          user_id: string
          vibration_enabled?: boolean
        }
        Update: {
          created_at?: string
          earning_notifications?: boolean
          id?: string
          message_notifications?: boolean
          order_notifications?: boolean
          push_notifications?: boolean
          social_notifications?: boolean
          sound_enabled?: boolean
          updated_at?: string
          user_id?: string
          vibration_enabled?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string | null
          order_id: string
          price_at_time: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          order_id: string
          price_at_time: number
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          order_id?: string
          price_at_time?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_reviews: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          order_id: string
          rating: number
          restaurant_id: string
          review_text: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          order_id: string
          rating: number
          restaurant_id: string
          review_text?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string
          rating?: number
          restaurant_id?: string
          review_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          payment_method: string
          pickup_otp: string | null
          pickup_time: string | null
          prep_minutes: number
          prep_start_at: string | null
          restaurant_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          payment_method?: string
          pickup_otp?: string | null
          pickup_time?: string | null
          prep_minutes?: number
          prep_start_at?: string | null
          restaurant_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          payment_method?: string
          pickup_otp?: string | null
          pickup_time?: string | null
          prep_minutes?: number
          prep_start_at?: string | null
          restaurant_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          order_id: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          created_at: string
          id: string
          order_id: string
          payout_notes: string | null
          payout_status: string
          platform_fee: number
          processed_at: string | null
          razorpay_transfer_id: string | null
          restaurant_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          payout_notes?: string | null
          payout_status?: string
          platform_fee: number
          processed_at?: string | null
          razorpay_transfer_id?: string | null
          restaurant_amount: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          payout_notes?: string | null
          payout_status?: string
          platform_fee?: number
          processed_at?: string | null
          razorpay_transfer_id?: string | null
          restaurant_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          campus: string | null
          city: string | null
          created_at: string
          id: string
          name: string
          state: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          campus?: string | null
          city?: string | null
          created_at?: string
          id: string
          name: string
          state?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          campus?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          state?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      pulse_likes: {
        Row: {
          created_at: string
          id: string
          pulse_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pulse_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pulse_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_likes_pulse_id_fkey"
            columns: ["pulse_id"]
            isOneToOne: false
            referencedRelation: "pulses"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_views: {
        Row: {
          created_at: string
          id: string
          pulse_id: string
          viewer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pulse_id: string
          viewer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pulse_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_views_pulse_id_fkey"
            columns: ["pulse_id"]
            isOneToOne: false
            referencedRelation: "pulses"
            referencedColumns: ["id"]
          },
        ]
      }
      pulses: {
        Row: {
          background_color: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: Database["public"]["Enums"]["pulse_media_type"]
          media_url: string | null
          text_content: string | null
          user_id: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type: Database["public"]["Enums"]["pulse_media_type"]
          media_url?: string | null
          text_content?: string | null
          user_id: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: Database["public"]["Enums"]["pulse_media_type"]
          media_url?: string | null
          text_content?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          device_type: string | null
          id: string
          player_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          id?: string
          player_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_type?: string | null
          id?: string
          player_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          customer_id: string
          id: string
          order_id: string
          razorpay_refund_id: string | null
          reason: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          customer_id: string
          id?: string
          order_id: string
          razorpay_refund_id?: string | null
          reason?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string
          razorpay_refund_id?: string | null
          reason?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_bank_details: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          bank_name: string | null
          created_at: string
          id: string
          ifsc_code: string | null
          restaurant_id: string
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string | null
          restaurant_id: string
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string | null
          restaurant_id?: string
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_bank_details_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_compliance: {
        Row: {
          created_at: string
          fssai_license: string | null
          gst_number: string | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fssai_license?: string | null
          gst_number?: string | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fssai_license?: string | null
          gst_number?: string | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_owner_details: {
        Row: {
          aadhaar_number: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          full_address: string | null
          id: string
          pan_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aadhaar_number?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          full_address?: string | null
          id?: string
          pan_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aadhaar_number?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          full_address?: string | null
          id?: string
          pan_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string
          area: string | null
          city: string | null
          closing_hours: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          max_advance_minutes: number
          max_orders_per_slot: number
          max_workload_per_slot: number
          min_advance_minutes: number
          name: string
          opening_hours: string | null
          orders_paused_indefinitely: boolean
          orders_paused_until: string | null
          owner_id: string
          photo_url: string | null
          pickup_slot_minutes: number
          preparation_buffer_minutes: number
          university_name: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          address: string
          area?: string | null
          city?: string | null
          closing_hours?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          max_advance_minutes?: number
          max_orders_per_slot?: number
          max_workload_per_slot?: number
          min_advance_minutes?: number
          name: string
          opening_hours?: string | null
          orders_paused_indefinitely?: boolean
          orders_paused_until?: string | null
          owner_id: string
          photo_url?: string | null
          pickup_slot_minutes?: number
          preparation_buffer_minutes?: number
          university_name?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          address?: string
          area?: string | null
          city?: string | null
          closing_hours?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          max_advance_minutes?: number
          max_orders_per_slot?: number
          max_workload_per_slot?: number
          min_advance_minutes?: number
          name?: string
          opening_hours?: string | null
          orders_paused_indefinitely?: boolean
          orders_paused_until?: string | null
          owner_id?: string
          photo_url?: string | null
          pickup_slot_minutes?: number
          preparation_buffer_minutes?: number
          university_name?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: []
      }
      transfer_rate_limits: {
        Row: {
          id: string
          transfer_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          id?: string
          transfer_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          id?: string
          transfer_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      user_contact_info: {
        Row: {
          created_at: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_private_key_backups: {
        Row: {
          created_at: string
          encrypted_private_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_private_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_private_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_public_keys: {
        Row: {
          created_at: string
          id: string
          public_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          public_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          public_key?: string
          updated_at?: string
          user_id?: string
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
      user_wallet: {
        Row: {
          id: string
          total_coins: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          total_coins?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          total_coins?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_view_once_media: {
        Args: { _message_id: string }
        Returns: {
          file_path: string
          media_filename: string
          media_iv: string
          media_key: string
          media_type: string
        }[]
      }
      finalize_view_once_media: {
        Args: { _message_id: string }
        Returns: undefined
      }
      get_customer_phone_for_owner: {
        Args: { _customer_id: string }
        Returns: string
      }
      get_leaderboard_top10: {
        Args: never
        Returns: {
          avatar_url: string
          campus: string
          name: string
          total_coins: number
          user_id: string
          username: string
        }[]
      }
      get_restaurant_avg_rating: {
        Args: { _restaurant_id: string }
        Returns: {
          avg_rating: number
          review_count: number
        }[]
      }
      get_slot_usage: {
        Args: { _from: string; _restaurant_id: string; _to: string }
        Returns: {
          order_count: number
          slot_start: string
          workload: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blocked_between: {
        Args: { _user_a: string; _user_b: string }
        Returns: boolean
      }
      is_blocked_by: {
        Args: { _target_user_id: string; _viewer_user_id: string }
        Returns: boolean
      }
      is_club_admin: {
        Args: { _club_id: string; _user_id: string }
        Returns: boolean
      }
      is_club_member: {
        Args: { _club_id: string; _user_id: string }
        Returns: boolean
      }
      kick_media_cleanup: { Args: never; Returns: undefined }
      redeem_coins: {
        Args: { _coins: number; _order_id?: string }
        Returns: number
      }
      sweep_stale_view_once_media: { Args: never; Returns: undefined }
      transfer_coins: {
        Args: { _coins: number; _recipient_id: string; _sender_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "customer" | "restaurant" | "admin"
      club_role: "admin" | "member"
      coin_type: "earn" | "redeem" | "transfer"
      order_status:
        | "pending_payment"
        | "placed"
        | "accepted"
        | "preparing"
        | "ready_for_pickup"
        | "picked_up"
        | "completed"
        | "cancelled"
      pulse_media_type: "image" | "video" | "text"
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
      app_role: ["customer", "restaurant", "admin"],
      club_role: ["admin", "member"],
      coin_type: ["earn", "redeem", "transfer"],
      order_status: [
        "pending_payment",
        "placed",
        "accepted",
        "preparing",
        "ready_for_pickup",
        "picked_up",
        "completed",
        "cancelled",
      ],
      pulse_media_type: ["image", "video", "text"],
    },
  },
} as const
