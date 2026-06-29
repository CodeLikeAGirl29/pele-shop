// components/store/Hero.tsx
//
// The hero section at the top of the storefront.
// Server component — no interactivity needed here, so no
// 'use client'. Next.js renders this on the server and sends
// plain HTML, which is faster for the user.
//
// It receives the "featured" product as a prop so the parent
// page can pass in whatever product it wants to highlight.

import Image from "next/image";
import type { Product } from "@/types/database";
import styles from "./Hero.module.css";

interface HeroProps {
  featuredProduct: Product | null;
}

export default function Hero({ featuredProduct }: HeroProps) {
  return (
    <section className={styles.hero}>
      {/* LEFT: headline copy */}
      <div className={styles.text}>
        <p className={styles.eyebrow}>New arrivals — Summer 2026</p>

        {/* The <em> gets the italic serif + accent color treatment */}
        <h1 className={styles.headline}>
          Objects made
          <br />
          to <em>last</em> a<br />
          lifetime
        </h1>

        <p className={styles.sub}>
          Thoughtfully sourced home goods. Each piece chosen for craftsmanship,
          not trends.
        </p>

        <a href="#products" className={styles.cta}>
          Shop all products
          <span aria-hidden="true"> →</span>
        </a>

        {/* Small stats row — adds credibility */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>140+</span>
            <span className={styles.statLabel}>Products</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>12</span>
            <span className={styles.statLabel}>Makers</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>4.9★</span>
            <span className={styles.statLabel}>Avg rating</span>
          </div>
        </div>
      </div>

      {/* RIGHT: featured product card */}
      {featuredProduct && (
        <div className={styles.featured}>
          {/* Product image — or placeholder if no images */}
          <div className={styles.imageWrap}>
            {featuredProduct.images?.[0] ? (
              <Image
                src={featuredProduct.images[0]}
                alt={featuredProduct.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={styles.image}
                priority // loads eagerly — it's above the fold
              />
            ) : (
              <div className={styles.imagePlaceholder} aria-hidden="true" />
            )}
            <span className={styles.badge}>Featured</span>
          </div>

          {/* Card footer with name and price */}
          <div className={styles.cardInfo}>
            <div>
              <p className={styles.cardName}>{featuredProduct.name}</p>
              <p className={styles.cardMeta}>
                {featuredProduct.category} · In stock
              </p>
            </div>
            <p className={styles.cardPrice}>
              ${featuredProduct.price.toFixed(0)}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
