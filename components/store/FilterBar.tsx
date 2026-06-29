"use client";
// components/store/FilterBar.tsx
//
// The row of category pills + sort dropdown above the product grid.
//
// This is a client component because clicking a filter updates
// the URL search params, which triggers the page to re-fetch
// filtered products from Supabase.
//
// We use URL params (not useState) so that:
//   - Filtered views are shareable/bookmarkable
//   - The browser back button works correctly
//   - Server components can read the filter and query Supabase

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import styles from "./FilterBar.module.css";

// These match the category values in our Supabase products table
const CATEGORIES = [
  "All",
  "Kitchen",
  "Home",
  "Audio",
  "Apparel",
  "Accessories",
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
];

interface FilterBarProps {
  totalCount: number;
}

export default function FilterBar({ totalCount }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // useTransition marks the navigation as non-urgent so the UI
  // stays responsive while Next.js fetches new data
  const [isPending, startTransition] = useTransition();

  // Read current filter values from the URL
  const currentCategory = searchParams.get("category") ?? "All";
  const currentSort = searchParams.get("sort") ?? "featured";

  // Helper: update one param while preserving the others
  function updateParam(key: string, value: string) {
    // URLSearchParams is immutable so we copy it
    const params = new URLSearchParams(searchParams.toString());

    if (value === "All" || value === "featured") {
      // Remove the param entirely when it's the default value
      // so URLs stay clean: /?category=All → /
      params.delete(key);
    } else {
      params.set(key, value);
    }

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    // startTransition wraps the navigation so React knows it's
    // a background update and keeps the current UI interactive
    startTransition(() => {
      router.push(url, { scroll: false });
    });
  }

  return (
    <div className={styles.bar}>
      {/* Category pills */}
      <div className={styles.pills}>
        <span className={styles.label}>Filter</span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => updateParam("category", cat)}
            className={`${styles.pill} ${
              currentCategory === cat ? styles.active : ""
            }`}
            // Disable during navigation so you can't spam clicks
            disabled={isPending}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Right side: result count + sort */}
      <div className={styles.right}>
        {/* isPending fades the count while new data loads */}
        <span className={styles.count} style={{ opacity: isPending ? 0.4 : 1 }}>
          {totalCount} {totalCount === 1 ? "item" : "items"}
        </span>

        <select
          value={currentSort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className={styles.sort}
          disabled={isPending}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
