// app/checkout/success/page.tsx
//
// The page Stripe redirects to after a successful payment.
// Stripe appends ?session_id=cs_... to the URL.
//
// We use that session ID to fetch the order details from
// Stripe and show a confirmation to the customer.
//
// The CartDrawer's "clear cart" runs client-side after this
// page mounts — see the ClearCartOnMount component below.

import { Suspense } from "react";
import Stripe from "stripe";
import Nav from "@/components/store/Nav";
import ClearCartOnMount from "@/components/store/ClearCartOnMount";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Order confirmed" };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

interface PageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const { session_id } = await searchParams;

  // Fetch the session from Stripe to get order details
  let session: Stripe.Checkout.Session | null = null;

  if (session_id) {
    try {
      session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["line_items"],
      });
    } catch {
      // Invalid session ID — just show a generic success
    }
  }

  const total = session?.amount_total
    ? `$${(session.amount_total / 100).toFixed(2)}`
    : null;

  const email = session?.customer_details?.email;

  return (
    <>
      <Nav />
      {/* Clear the cart now that payment is done */}
      <ClearCartOnMount />

      <main className={styles.main}>
        <div className={styles.card}>
          {/* Checkmark */}
          <div className={styles.icon} aria-hidden="true">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h1 className={styles.title}>Order confirmed</h1>

          <p className={styles.sub}>
            {email ? (
              <>
                A confirmation has been sent to <strong>{email}</strong>.
              </>
            ) : (
              "Your order has been placed successfully."
            )}
          </p>

          {/* Order summary */}
          {session?.line_items?.data && (
            <div className={styles.items}>
              {session.line_items.data.map((item) => (
                <div key={item.id} className={styles.lineItem}>
                  <span className={styles.lineItemName}>
                    {item.description}
                    <span className={styles.lineItemQty}>
                      {" "}
                      × {item.quantity}
                    </span>
                  </span>
                  <span className={styles.lineItemPrice}>
                    ${((item.amount_total ?? 0) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {total && (
            <div className={styles.total}>
              <span>Total paid</span>
              <span className={styles.totalAmount}>{total}</span>
            </div>
          )}

          <a href="/" className={styles.continueBtn}>
            Continue shopping
          </a>
        </div>
      </main>
    </>
  );
}
