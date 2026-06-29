// app/page.tsx
//
// The storefront homepage. This is a SERVER component by default
// in Next.js App Router — no 'use client' needed.
//
// It does two things:
//   1. Reads filter/sort params from the URL (?category=Kitchen&sort=price_asc)
//   2. Fetches the featured product and passes it to the Hero
//
// The ProductGrid also runs on the server and does its own
// Supabase fetch — so the whole page renders with real data,
// no client-side loading spinners on first load.

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/store/Nav";
import Hero from "@/components/store/Hero";
import FilterBar from "@/components/store/FilterBar";
import ProductGrid from "@/components/store/ProductGrid";

// Next.js passes searchParams as a prop to page components.
// The type comes from Next.js itself.
interface PageProps {
  searchParams: Promise<{ category?: string; sort?: string }>;
}

export default async function StorefrontPage({ searchParams }: PageProps) {
  // Await the searchParams (required in Next.js 15+)
  const { category, sort } = await searchParams;

  const supabase = await createClient();

  // Fetch the featured product for the hero (most recently added)
  // and the total count for the filter bar label
  const [{ data: featuredProducts }, { count }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true }) // head: true = count only, no rows
      .eq("is_active", true)
      // Apply the same category filter so the count matches what's shown
      .eq(
        category && category !== "All" ? "category" : "is_active",
        category && category !== "All" ? category : true,
      ),
  ]);

  const featuredProduct = featuredProducts?.[0] ?? null;

  return (
    <>
      {/*
        Nav is a client component (needs Zustand for cart count).
        Wrapping client components inside a server page like this
        is completely fine in Next.js App Router.
      */}
      <Nav />

      <main>
        <Hero featuredProduct={featuredProduct} />

        {/*
          Suspense boundary around FilterBar because it uses
          useSearchParams() which needs to be wrapped in Suspense
          when used in a client component inside a server page.
        */}
        <Suspense fallback={<div style={{ height: "3rem" }} />}>
          <FilterBar totalCount={count ?? 0} />
        </Suspense>

        {/*
          ProductGrid is async — it fetches its own data.
          The fallback shows while it's loading.
        */}
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid category={category} sort={sort} />
        </Suspense>
      </main>
    </>
  );
}

// A simple skeleton loader that matches the grid layout
// so the page doesn't jump when products load
function ProductGridSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1rem",
        padding: "0 2rem 4rem",
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "#F0ECE8",
            borderRadius: "10px",
            aspectRatio: i === 0 ? "2/1" : "1",
            gridColumn: i === 0 ? "span 2" : "span 1",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
