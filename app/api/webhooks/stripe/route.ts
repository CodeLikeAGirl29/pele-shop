import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

export const dynamic = "force-dynamic";

// Create a plain untyped Supabase client so TypeScript
// doesn't fight us on the insert shapes
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id || null;
    const rawItems = session.metadata?.items;

    if (!rawItems) {
      return NextResponse.json({ error: "Missing items" }, { status: 400 });
    }

    const items: {
      product_id: string;
      quantity: number;
      unit_price: number;
    }[] = JSON.parse(rawItems);

    const supabase = getSupabase();

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        stripe_session_id: session.id,
        status: "paid",
        total: (session.amount_total ?? 0) / 100,
        shipping_address: null,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Failed to create order:", orderError);
      return NextResponse.json(
        { error: "Order creation failed" },
        { status: 500 }
      );
    }

    // Insert order items
    await supabase.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))
    );

    // Decrement stock
    for (const item of items) {
      await supabase
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single()
        .then(async ({ data }) => {
          if (data) {
            await supabase
              .from("products")
              .update({ stock: Math.max(0, data.stock - item.quantity) })
              .eq("id", item.product_id);
          }
        });
    }

    console.log(`Order ${order.id} created for session ${session.id}`);
  }

  return NextResponse.json({ received: true });
}
