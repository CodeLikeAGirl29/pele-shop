"use client";
// components/dashboard/Sidebar.tsx
//
// The left sidebar. Client component because usePathname()
// needs to run in the browser to highlight the active link.

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Overview",
    // Inline SVG icons — no icon library needed
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/dashboard/orders",
    label: "Orders",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    href: "/dashboard/inventory",
    label: "Inventory",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      >
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      </svg>
    ),
  },
];

export default function DashboardSidebar() {
  // usePathname returns the current URL path e.g. '/dashboard/orders'
  // We use it to apply an 'active' style to the matching nav item
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      {/* Logo / store name */}
      <Link href="/" className={styles.logo}>
        pelé<span className={styles.dot}>.</span>
        <span className={styles.logoSub}>dashboard</span>
      </Link>

      {/* Navigation */}
      <nav className={styles.nav}>
        <p className={styles.navLabel}>Menu</p>
        <ul className={styles.navList}>
          {NAV_ITEMS.map((item) => {
            // For the overview link, only mark active when
            // exactly on /dashboard, not on sub-routes
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom: link back to the store */}
      <div className={styles.bottom}>
        <Link href="/" className={styles.storeLink}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to store
        </Link>
      </div>
    </aside>
  );
}
