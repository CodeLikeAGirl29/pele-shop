"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/types/database";
import styles from "./AddToCartButton.module.css";

interface Props {
  product: Product;
}

export default function AddToCartButton({ product }: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const cartItems = useCartStore((state) => state.items);

  const [mounted, setMounted] = useState(false);
  const [localQty, setLocalQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const itemInCart = mounted
    ? cartItems.find((i) => i.product.id === product.id)
    : undefined;
  const countInCart = itemInCart?.quantity ?? 0;
  const isInCart = countInCart > 0;
  const isOutOfStock = product.stock === 0;

  // What the quantity picker shows
  const displayQty = isInCart ? countInCart : localQty;

  function handleDecrease() {
    if (isInCart) {
      if (countInCart === 1) {
        removeItem(product.id);
      } else {
        updateQuantity(product.id, countInCart - 1);
      }
    } else {
      setLocalQty((q) => Math.max(1, q - 1));
    }
  }

  function handleIncrease() {
    if (isInCart) {
      if (countInCart < product.stock) {
        updateQuantity(product.id, countInCart + 1);
      }
    } else {
      setLocalQty((q) => Math.min(product.stock, q + 1));
    }
  }

  function handleAddToCart() {
    addItem(product, localQty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.quantityRow}>
        <label className={styles.qtyLabel}>
          {isInCart ? "In your cart" : "Quantity"}
        </label>
        <div className={styles.qtyControl}>
          <button
            onClick={handleDecrease}
            // Only disable − when not in cart AND already at 1
            disabled={!isInCart && localQty <= 1}
            aria-label="Decrease quantity"
            className={styles.qtyBtn}
          >
            −
          </button>
          <span className={styles.qtyNum}>{displayQty}</span>
          <button
            onClick={handleIncrease}
            disabled={displayQty >= product.stock}
            aria-label="Increase quantity"
            className={styles.qtyBtn}
          >
            +
          </button>
        </div>
      </div>

      <button
        // Always attach a real handler — never set onClick to undefined
        onClick={isInCart ? undefined : handleAddToCart}
        disabled={isOutOfStock || isInCart}
        className={`${styles.addBtn} ${added ? styles.added : ""} ${isInCart ? styles.inCart : ""}`}
      >
        {isOutOfStock
          ? "Out of stock"
          : added
            ? "✓ Added to cart"
            : isInCart
              ? `In cart — ${countInCart} ${countInCart === 1 ? "item" : "items"}`
              : "Add to cart"}
      </button>
    </div>
  );
}
