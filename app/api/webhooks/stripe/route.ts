import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

export const dynamic = "force-dynamic";

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

    const supabase = createAdminClient();

    // Use rpc to insert order and bypass type inference issues
    const { data: orderId, error: orderError } = await supabase.rpc(
      "create_order",
      {
        p_user_id: userId,
        p_stripe_session_id: session.id,
        p_total: (session.amount_total ?? 0) / 100,
      }
    );

    if (orderError || !orderId) {
      console.error("Failed to create order:", orderError);
      // Fall back to raw insert if rpc doesn't exist yet
      const { data: order, error: insertError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: userId,
            stripe_session_id: session.id,
            status: "paid",
            total: (session.amount_total ?? 0) / 100,
            shipping_address: null,
          },
        ] as any)
        .select("id")
        .single();

      if (insertError || !order) {
        console.error("Failed to create order (fallback):", insertError);
        return NextResponse.json(
          { error: "Order creation failed" },
          { status: 500 }
        );
      }

      // Insert order items
      await supabase.from("order_items").insert(
        items.map((item) => ({
          order_id: (order as any).id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })) as any
      );

      // Decrement stock
      for (const item of items) {
        await supabase.rpc("decrement_stock", {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        });
      }

      console.log(`Order ${(order as any).id} created`);
      return NextResponse.json({ received: true });
    }

    // Insert order items using orderId from rpc
    await supabase.from("order_items").insert(
      items.map((item) => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })) as any
    );

    for (const item of items) {
      await supabase.rpc("decrement_stock", {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });
    }

    console.log(`Order ${orderId} created`);
  }

  return NextResponse.json({ received: true });
}
