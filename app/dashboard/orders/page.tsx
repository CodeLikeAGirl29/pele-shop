// app/dashboard/orders/page.tsx
//
// Full orders table. Server component that fetches all orders,
// then passes them to an interactive client component so
// merchants can update statuses inline.

import { createClient } from "@/lib/supabase/server";
import OrdersTable from "@/components/dashboard/OrdersTable";
import type { Metadata } from "next";
import styles from "../page.module.css";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      id,
      total,
      status,
      created_at,
      shipping_address,
      profiles ( full_name ),
      order_items (
        quantity,
        unit_price,
        products ( name, images )
      )
    `,
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Orders</h1>
        <p className={styles.subtitle}>{orders?.length ?? 0} total</p>
      </div>
      <OrdersTable orders={orders ?? []} />
    </div>
  );
}
