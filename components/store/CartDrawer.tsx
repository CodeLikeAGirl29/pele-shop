"use client";
// components/store/CartDrawer.tsx
//
// Slides in from the right when the cart button is clicked.
// Shows all cart items with quantity controls and a total.
//
// Structure:
//   - Backdrop (dark overlay behind the drawer, click to close)
//   - Drawer panel (slides in from right)
//     - Header with close button
//     - Item list (scrollable if many items)
//     - Footer with subtotal + checkout button

import { useEffect } from "react";
import Image from "next/image";
import { useCartStore } from "@/store/cart";
import { useCartUI } from "@/store/cartUI";
import styles from "./CartDrawer.module.css";

export default function CartDrawer() {
  const { isOpen, close } = useCartUI();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalPrice = useCartStore((state) => state.totalPrice());
  const totalItems = useCartStore((state) => state.totalItems());

  // Lock body scroll when drawer is open so the page
  // doesn't scroll behind it
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    // Cleanup when component unmounts
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [close]);

  return (
    <>
      {/* BACKDROP — clicking it closes the drawer */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ""}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* DRAWER PANEL */}
      <div
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>Cart</h2>
            {totalItems > 0 && (
              <span className={styles.itemCount}>
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <button
            className={styles.closeBtn}
            onClick={close}
            aria-label="Close cart"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* EMPTY STATE */}
        {items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} aria-hidden="true">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <p className={styles.emptyTitle}>Your cart is empty</p>
            <p className={styles.emptySub}>
              Add something beautiful to get started.
            </p>
            <button className={styles.continueBtn} onClick={close}>
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            {/* ITEM LIST — scrollable */}
            <ul className={styles.items}>
              {items.map(({ product, quantity }) => (
                <li key={product.id} className={styles.item}>
                  {/* Product image */}
                  <div className={styles.itemImage}>
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="72px"
                        className={styles.itemImg}
                      />
                    ) : (
                      <div className={styles.itemImgPlaceholder} />
                    )}
                  </div>

                  {/* Product info */}
                  <div className={styles.itemInfo}>
                    <p className={styles.itemCategory}>{product.category}</p>
                    <p className={styles.itemName}>{product.name}</p>
                    <p className={styles.itemPrice}>
                      ${(product.price * quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity controls + remove */}
                  <div className={styles.itemControls}>
                    <div className={styles.qtyRow}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() =>
                          quantity === 1
                            ? removeItem(product.id)
                            : updateQuantity(product.id, quantity - 1)
                        }
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className={styles.qty}>{quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        disabled={quantity >= product.stock}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(product.id)}
                      aria-label={`Remove ${product.name}`}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* FOOTER */}
            <div className={styles.footer}>
              {/* Subtotal */}
              <div className={styles.subtotalRow}>
                <span className={styles.subtotalLabel}>Subtotal</span>
                <span className={styles.subtotalValue}>
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
              <p className={styles.shippingNote}>
                Shipping calculated at checkout
              </p>

              {/* Checkout CTA */}
              <button className={styles.checkoutBtn}>
                Proceed to checkout →
              </button>

              {/* Clear cart */}
              <button className={styles.clearBtn} onClick={clearCart}>
                Clear cart
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
