// components/dashboard/RecentOrders.tsx
//
// Shows the 5 most recent orders in a compact table.
// Server component — no interactivity needed here.

import styles from "./RecentOrders.module.css";

// Status badge colors
const STATUS_STYLES: Record<string, string> = {
  pending: "statusPending",
  paid: "statusPaid",
  shipped: "statusShipped",
  delivered: "statusDelivered",
  cancelled: "statusCancelled",
};

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
  order_items: {
    quantity: number;
    products: { name: string } | null;
  }[];
}

interface RecentOrdersProps {
  orders: Order[];
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
  if (orders.length === 0) {
    return <p className={styles.empty}>No orders yet.</p>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Customer</th>
          <th>Items</th>
          <th>Total</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => {
          // Summarise items: "Record Player, Lamp +1"
          const itemNames = order.order_items.map(
            (i) => i.products?.name ?? "Unknown",
          );
          const itemSummary =
            itemNames.length > 2
              ? `${itemNames.slice(0, 2).join(", ")} +${itemNames.length - 2}`
              : itemNames.join(", ");

          const date = new Date(order.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          const statusClass = STATUS_STYLES[order.status] ?? "statusPending";

          return (
            <tr key={order.id}>
              <td className={styles.customer}>
                {order.profiles?.full_name ?? "Guest"}
              </td>
              <td className={styles.items}>{itemSummary}</td>
              <td className={styles.total}>${order.total.toFixed(2)}</td>
              <td>
                <span className={`${styles.status} ${styles[statusClass]}`}>
                  {order.status}
                </span>
              </td>
              <td className={styles.date}>{date}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
