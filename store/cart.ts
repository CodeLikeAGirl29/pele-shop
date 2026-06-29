"use client";
// store/cart.ts
//
// Zustand is like useState but it lives outside React components,
// so any component in the tree can read and update it without
// passing props around.
//
// The `persist` middleware automatically saves the cart to
// localStorage and rehydrates it on page load.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types/database";

interface CartStore {
  // STATE
  items: CartItem[];

  // ACTIONS
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // DERIVED VALUES (computed from items)
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  // `persist` wraps our store and syncs it to localStorage
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        set((state) => {
          // Check if this product is already in the cart
          const existing = state.items.find(
            (item) => item.product.id === product.id
          );

          if (existing) {
            // If it's already there, increase the quantity
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          // Otherwise add it as a new item
          return { items: [...state.items, { product, quantity }] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        // If quantity drops to 0, remove the item entirely
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      // These are functions rather than values so they're always
      // computed fresh from the current items array
      totalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      totalPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
      },
    }),
    {
      name: "pele-shop-cart", // the localStorage key
    }
  )
);
