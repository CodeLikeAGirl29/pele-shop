"use client";
// store/cartUI.ts
//
// Tiny Zustand store just for whether the cart drawer is open.
// Kept separate from cart.ts (which holds items) because this
// is purely UI state — it doesn't need to persist to localStorage.

import { create } from "zustand";

interface CartUIStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useCartUI = create<CartUIStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
