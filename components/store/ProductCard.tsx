"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/types/database";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: Product;
  featured?: boolean;
}

export default function ProductCard({
  product,
  featured = false,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);

  // mounted must be declared BEFORE it's used below
  const [mounted, setMounted] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Now safe to reference mounted
  const itemInCart = mounted
    ? cartItems.find((i) => i.product.id === product.id)
    : undefined;
  const countInCart = itemInCart?.quantity ?? 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const stockStatus =
    product.stock === 0
      ? { label: "Out of stock", className: styles.outOfStock }
      : product.stock < 10
        ? { label: `${product.stock} left`, className: styles.lowStock }
        : { label: "In stock", className: styles.inStock };

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`${styles.card} ${featured ? styles.featured : ""}`}
    >
      <div className={styles.imageWrap}>
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes={
              featured
                ? "(max-width: 768px) 100vw, 66vw"
                : "(max-width: 768px) 100vw, 33vw"
            }
            className={styles.image}
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true" />
        )}

        {product.stock > 0 && product.stock < 10 && (
          <span className={styles.badge}>Low stock</span>
        )}

        {product.stock > 0 && (
          <button
            className={styles.addBtn}
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
          >
            {added ? "✓ Added" : "Add to cart"}
            {countInCart > 0 && (
              <span className={styles.cartBadge}>{countInCart}</span>
            )}
          </button>
        )}
      </div>

      <div className={styles.body}>
        <p className={styles.category}>{product.category}</p>
        <h2 className={styles.name}>{product.name}</h2>
        <div className={styles.footer}>
          <span className={styles.price}>${product.price.toFixed(0)}</span>
          <span className={`${styles.stock} ${stockStatus.className}`}>
            {stockStatus.label}
          </span>
        </div>
      </div>
    </Link>
  );
}
