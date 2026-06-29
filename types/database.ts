// types/database.ts
//
// These types mirror our Supabase schema exactly.
// The Database type is what we pass to createClient<Database>()
// so TypeScript knows the shape of every table.
//
// Pro tip: Supabase can auto-generate this file from your live
// schema by running:
//   npx supabase gen types typescript --project-id YOUR_ID > types/database.ts
// But writing it by hand first teaches you what it's doing.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "customer" | "merchant";
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "customer" | "merchant";
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "customer" | "merchant";
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          stock: number;
          category: string;
          images: string[];
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          stock?: number;
          category: string;
          images?: string[];
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          stock?: number;
          category?: string;
          images?: string[];
          is_active?: boolean;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          stripe_session_id: string | null;
          status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
          total: number;
          shipping_address: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          stripe_session_id?: string | null;
          status?: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
          total: number;
          shipping_address?: Json | null;
          created_at?: string;
        };
        Update: {
          status?: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
          shipping_address?: Json | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          quantity: number;
          unit_price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          quantity: number;
          unit_price: number;
        };
        Update: {
          quantity?: number;
          unit_price?: number;
        };
      };
    };
  };
}

// ============================================================
// Convenience types — use these throughout the app instead of
// writing Database['public']['Tables']['products']['Row'] everywhere
// ============================================================

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

// Order with its items joined (what the dashboard shows)
export type OrderWithItems = Order & {
  order_items: (OrderItem & {
    products: Pick<Product, "id" | "name" | "images"> | null;
  })[];
  profiles: Pick<Profile, "full_name"> | null;
};

// Cart item — lives in Zustand, not in the database
export interface CartItem {
  product: Product;
  quantity: number;
}
