"use client";
// components/store/ClearCartOnMount.tsx
//
// Renders nothing — just clears the Zustand cart once on mount.
// Used on the success page so the cart empties after payment.
//
// We need a separate client component for this because the
// success page itself is a server component (it fetches from
// Stripe on the server), and server components can't call
// Zustand or useEffect.

import { useEffect } from "react";
import { useCartStore } from "@/store/cart";

export default function ClearCartOnMount() {
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
