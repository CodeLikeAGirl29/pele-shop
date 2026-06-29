// app/dashboard/page.tsx
//
// The main dashboard overview. Server component — fetches all
// the data it needs from Supabase, then passes it down to
// client components for interactivity (the chart).
//
// Data fetched here:
//   - Total revenue, order count, avg order value (KPI cards)
//   - Revenue per day for the last 30 days (chart)
//   - 5 most recent orders (recent orders table)
//   - Low stock products (inventory alert)

import { createClient } from "@/lib/supabase/server";
import RevenueChart from "@/components/dashboard/RevenueChart";
import KpiCard from "@/components/dashboard/KpiCard";
import RecentOrders from "@/components/dashboard/RecentOrders";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const supabase = await createClient();

  // Run all queries in parallel with Promise.all so we don't
  // wait for each one sequentially
  const [{ data: orders }, { data: products }, { data: recentOrders }] =
    await Promise.all([
      // All paid/shipped/delivered orders for KPI calculation
      supabase
        .from("orders")
        .select("total, created_at, status")
        .in("status", ["paid", "shipped", "delivered"])
        .order("created_at", { ascending: true }),

      // All products for inventory alerts
      supabase
        .from("products")
        .select("id, name, stock, category")
        .eq("is_active", true)
        .order("stock", { ascending: true }),

      // Most recent 5 orders with their items + customer name
      supabase
        .from("orders")
        .select(
          `
        id,
        total,
        status,
        created_at,
        profiles ( full_name ),
        order_items ( quantity, unit_price, products ( name ) )
      `,
        )
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  // ---- KPI calculations ----
  const totalRevenue = orders?.reduce((sum, o) => sum + o.total, 0) ?? 0;
  const orderCount = orders?.length ?? 0;
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  // Low stock = products with fewer than 10 units
  const lowStockProducts = products?.filter((p) => p.stock < 10) ?? [];

  // ---- Revenue chart data ----
  // Build a map of date → revenue for the last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0]; // 'YYYY-MM-DD'
  });

  // Sum revenue per day from orders
  const revenueByDay = new Map<string, number>();
  orders?.forEach((order) => {
    const day = order.created_at.split("T")[0];
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + order.total);
  });

  // Fill in zeros for days with no orders so the chart
  // shows a continuous line rather than gaps
  const chartData = last30Days.map((date) => ({
    date,
    // Short label for chart x-axis: 'Jun 1'
    label: new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    revenue: revenueByDay.get(date) ?? 0,
  }));

  return (
    <div>
      {/* PAGE HEADER */}
      <div className={styles.header}>
        <h1 className={styles.title}>Overview</h1>
        <p className={styles.subtitle}>Last 30 days</p>
      </div>

      {/* KPI CARDS */}
      <div className={styles.kpiGrid}>
        <KpiCard
          label="Total revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          sub={`${orderCount} orders`}
        />
        <KpiCard
          label="Avg order value"
          value={`$${avgOrderValue.toFixed(2)}`}
          sub="per order"
        />
        <KpiCard
          label="Products"
          value={String(products?.length ?? 0)}
          sub={`${lowStockProducts.length} low stock`}
          alert={lowStockProducts.length > 0}
        />
        <KpiCard
          label="Orders"
          value={String(orderCount)}
          sub="paid & fulfilled"
        />
      </div>

      {/* REVENUE CHART */}
      {/* RevenueChart is a client component — Recharts needs the browser */}
      <div className={styles.chartCard}>
        <h2 className={styles.cardTitle}>Revenue — last 30 days</h2>
        <RevenueChart data={chartData} />
      </div>

      {/* BOTTOM ROW: recent orders + low stock */}
      <div className={styles.bottomGrid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Recent orders</h2>
          <RecentOrders orders={recentOrders ?? []} />
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Low stock</h2>
          {lowStockProducts.length === 0 ? (
            <p className={styles.empty}>All products well stocked.</p>
          ) : (
            <ul className={styles.stockList}>
              {lowStockProducts.map((p) => (
                <li key={p.id} className={styles.stockItem}>
                  <span className={styles.stockName}>{p.name}</span>
                  <span
                    className={`${styles.stockCount} ${
                      p.stock === 0 ? styles.stockOut : styles.stockLow
                    }`}
                  >
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
