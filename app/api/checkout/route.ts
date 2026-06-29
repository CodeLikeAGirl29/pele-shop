// app/api/checkout/route.ts
//
// POST /api/checkout
//
// Receives the cart items from the client, creates a Stripe
// Checkout Session, and returns the session URL.
//
// The client then redirects the user to that URL — Stripe
// handles the entire payment form, card validation, and 3DS.
//
// We never touch raw card numbers. Stripe does all of that.

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import type { CartItem } from "@/types/database";

// Initialise the Stripe client with our secret key.
// This only runs on the server — the secret key is never
// sent to the browser.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

export async function POST(request: Request) {
  try {
    const { items }: { items: CartItem[] } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    // Get the current user (if logged in) so we can attach
    // the order to their account in the webhook
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Build the line_items array Stripe expects.
    // Each item needs a name, price (in cents), and quantity.
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      ({ product, quantity }) => ({
        price_data: {
          currency: "usd",
          // Stripe works in cents — multiply dollars by 100
          unit_amount: Math.round(product.price * 100),
          product_data: {
            name: product.name,
            description: product.description ?? undefined,
            // Stripe shows the product image in its checkout UI
            images: product.images?.[0] ? [product.images[0]] : [],
          },
        },
        quantity,
      })
    );

    // Create the Checkout Session.
    // Stripe hosts the payment page at session.url
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      // Where to send the user after successful payment
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      // Where to send them if they click "Back" on Stripe's page
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?cancelled=true`,
      // Collect shipping address on the Stripe checkout page
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU"],
      },
      // Pass metadata so the webhook can create the order
      // in Supabase with the right user attached
      metadata: {
        user_id: user?.id ?? "",
        // Serialize the cart so the webhook knows what was ordered
        items: JSON.stringify(
          items.map(({ product, quantity }) => ({
            product_id: product.id,
            quantity,
            unit_price: product.price,
          }))
        ),
      },
    });

    // Return the checkout URL to the client
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
