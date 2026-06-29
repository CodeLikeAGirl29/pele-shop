// components/store/ProductGrid.tsx
//
// Server component that fetches products from Supabase and
// renders the grid. Because it's a server component:
//   - It runs on the server, never in the browser
//   - It can be async and await database calls directly
//   - No useEffect, no loading spinners for the initial fetch
//
// It reads category + sort from the URL params passed in by
// the parent page, which means filtering happens server-side
// (Supabase does the filtering, not the browser).

import { createClient } from "@/lib/supabase/server";
import ProductCard from "./ProductCard";
import styles from "./ProductGrid.module.css";

interface ProductGridProps {
  category?: string;
  sort?: string;
}

export default async function ProductGrid({
  category,
  sort,
}: ProductGridProps) {
  const supabase = await createClient();

  // Start building the query
  let query = supabase
    .from("products")
    .select("*")
    // Only show active products (is_active = true)
    .eq("is_active", true);

  // Apply category filter if one is selected
  // We skip this when category is 'All' or undefined
  if (category && category !== "All") {
    query = query.eq("category", category);
  }

  // Apply sort order
  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      // 'featured' — just use created_at for now
      // In a real store you'd have a 'sort_order' column
      query = query.order("created_at", { ascending: true });
  }

  const { data: products, error } = await query;

  // If the database query fails, show a helpful error state
  if (error) {
    return (
      <div className={styles.error}>
        <p>Couldn't load products. Please try again.</p>
        <p className={styles.errorDetail}>{error.message}</p>
      </div>
    );
  }

  // Empty state when no products match the filter
  if (!products || products.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No products found</p>
        <p className={styles.emptySub}>
          Try a different category or clear your filters.
        </p>
      </div>
    );
  }

  return (
    <section className={styles.section} id="products">
      <div className={styles.grid}>
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            // First card gets the wide 2-column treatment
            featured={index === 0}
          />
        ))}
      </div>
    </section>
  );
}
