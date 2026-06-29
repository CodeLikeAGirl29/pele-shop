// components/dashboard/KpiCard.tsx
//
// A single metric card — label, big number, and a sub-label.
// The `alert` prop turns the sub-label amber to signal
// something needs attention (e.g. low stock count).

import styles from "./KpiCard.module.css";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
}

export default function KpiCard({ label, value, sub, alert }: KpiCardProps) {
  return (
    <div className={styles.card}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
      {sub && (
        <p className={`${styles.sub} ${alert ? styles.alert : ""}`}>{sub}</p>
      )}
    </div>
  );
}
