"use client";
// components/dashboard/OrdersTable.tsx
//
// Interactive orders table. Client component because:
//   - Status can be updated inline with a dropdown
//   - Optimistic UI: status updates instantly in the browser
//     before the server confirms, so the UI feels snappy
//
// "Optimistic UI" means we update the local state immediately
// when the merchant changes a status, rather than waiting for
// the Supabase call to finish. If it fails, we roll back.

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./OrdersTable.module.css";

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];

const STATUS_STYLES: Record<string, string> = {
  pending: styles.statusPending,
  paid: styles.statusPaid,
  shipped: styles.statusShipped,
  delivered: styles.statusDelivered,
  cancelled: styles.statusCancelled,
};

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
  order_items: {
    quantity: number;
    unit_price: number;
    products: { name: string; images: string[] } | null;
  }[];
}

interface OrdersTableProps {
  orders: Order[];
}

export default function OrdersTable({
  orders: initialOrders,
}: OrdersTableProps) {
  // Local copy of orders so we can update them optimistically
  const [orders, setOrders] = useState(initialOrders);
  const [updating, setUpdating] = useState<string | null>(null);

  const supabase = createClient();

  async function updateStatus(orderId: string, newStatus: string) {
    // Save the old status in case we need to roll back
    const oldOrders = orders;

    // Optimistic update — change the UI immediately
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );
    setUpdating(orderId);

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      // Roll back if the update failed
      console.error("Failed to update status:", error);
      setOrders(oldOrders);
    }

    setUpdating(null);
  }

  if (orders.length === 0) {
    return (
      <p style={{ color: "var(--ink-3)", fontSize: "0.875rem" }}>
        No orders yet.
      </p>
    );
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const itemSummary = order.order_items
              .map((i) => `${i.products?.name ?? "Item"} ×${i.quantity}`)
              .join(", ");

            const date = new Date(order.created_at).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              },
            );

            return (
              <tr
                key={order.id}
                className={updating === order.id ? styles.updating : ""}
              >
                {/* Order ID — truncated to 8 chars */}
                <td className={styles.orderId}>#{order.id.slice(0, 8)}</td>

                <td className={styles.customer}>
                  {order.profiles?.full_name ?? "Guest"}
                </td>

                <td className={styles.items}>{itemSummary}</td>

                <td className={styles.total}>${order.total.toFixed(2)}</td>

                <td className={styles.date}>{date}</td>

                {/* Inline status dropdown — updates Supabase on change */}
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className={`${styles.statusSelect} ${STATUS_STYLES[order.status] ?? ""}`}
                    disabled={updating === order.id}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
