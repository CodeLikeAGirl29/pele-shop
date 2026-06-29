// app/api/webhooks/stripe/route.ts
//
// POST /api/webhooks/stripe
//
// Stripe calls this endpoint after payment events happen.
// We listen for 'checkout.session.completed' which fires
// when a customer successfully pays.
//
// What we do when payment succeeds:
//   1. Verify the webhook signature (proves it's really Stripe)
//   2. Create an order row in Supabase
//   3. Create order_item rows for each product purchased
//   4. Decrement stock for each product
//
// We use the ADMIN client here (service role key) because:
//   - There's no user session — this is a server-to-server call
//   - We need to bypass RLS to write orders from Stripe's server

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

// Tell Next.js not to parse the body — we need the raw bytes
// to verify Stripe's signature. If Next.js parses it first,
// the signature check fails.
export const config = {
  api: { bodyParser: false },
};

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // constructEvent verifies the webhook came from Stripe
    // and not from someone trying to fake a payment
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Only handle the event we care about
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Pull the metadata we attached when creating the session
    const userId = session.metadata?.user_id || null;
    const rawItems = session.metadata?.items;

    if (!rawItems) {
      console.error("No items in session metadata");
      return NextResponse.json({ error: "Missing items" }, { status: 400 });
    }

    const items: {
      product_id: string;
      quantity: number;
      unit_price: number;
    }[] = JSON.parse(rawItems);

    const supabase = createAdminClient();

    // 1. Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId || null,
        stripe_session_id: session.id,
        status: "paid",
        // Stripe gives us the total in cents — convert back to dollars
        total: (session.amount_total ?? 0) / 100,
        shipping_address: session.shipping_details ?? null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Failed to create order:", orderError);
      return NextResponse.json(
        { error: "Order creation failed" },
        { status: 500 }
      );
    }

    // 2. Create order items
    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))
    );

    if (itemsError) {
      console.error("Failed to create order items:", itemsError);
    }

    // 3. Decrement stock for each product
    // We do these one at a time with rpc to safely decrement
    for (const item of items) {
      await supabase.rpc("decrement_stock", {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });
    }

    console.log(`Order ${order.id} created for session ${session.id}`);
  }

  // Always return 200 — Stripe will retry if we return an error
  return NextResponse.json({ received: true });
}
