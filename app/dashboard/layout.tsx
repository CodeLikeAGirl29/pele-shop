// app/dashboard/layout.tsx
//
// Nested layout for all /dashboard/* routes.
// Next.js supports nested layouts — this one wraps every
// dashboard page with a sidebar + main content area.
//
// The middleware (proxy.ts) already blocks non-merchants
// before they even reach this layout, so we don't need
// to do auth checks here again.

import type { Metadata } from "next";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: {
    template: "%s — Dashboard",
    default: "Dashboard",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      {/* Fixed sidebar on the left */}
      <DashboardSidebar />

      {/* Scrollable main content on the right */}
      <main className={styles.main}>{children}</main>
    </div>
  );
}
