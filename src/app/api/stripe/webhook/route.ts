import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import {
  FulfillmentMessage,
  FulfillmentProduct,
  getStoreEnv,
} from "@/lib/cloudflare-store";

export const runtime = "nodejs";

const paidEvents = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

export async function POST(request: NextRequest) {
  const env = getStoreEnv();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }
  const body = await request.text();
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }
  if (!event.type.startsWith("checkout.session.")) {
    return NextResponse.json({ received: true });
  }
  const session = event.data.object as Stripe.Checkout.Session;
  const now = Math.floor(Date.now() / 1000);
  const inserted = await env.STORE_DB.prepare(
    `INSERT OR IGNORE INTO stripe_events
      (event_id, event_type, stripe_session_id, status, created_at, updated_at)
     VALUES (?, ?, ?, 'received', ?, ?)`,
  )
    .bind(event.id, event.type, session.id, now, now)
    .run();
  if (!inserted.success) {
    return NextResponse.json({ error: "event_store_failed" }, { status: 500 });
  }

  const orderId = session.metadata?.order_id;
  if (!orderId) {
    if (paidEvents.has(event.type)) {
      await enqueueLegacySession(event.id, session);
    }
    return NextResponse.json({ received: true });
  }
  if (
    event.type === "checkout.session.async_payment_failed" ||
    event.type === "checkout.session.expired"
  ) {
    await env.STORE_DB.batch([
      env.STORE_DB.prepare(
        "UPDATE store_orders SET status = ?, updated_at = ? WHERE order_id = ?",
      ).bind(
        event.type.endsWith("expired") ? "expired" : "payment_failed",
        now,
        orderId,
      ),
      env.STORE_DB.prepare(
        "UPDATE stripe_events SET status = 'processed', updated_at = ? WHERE event_id = ?",
      ).bind(now, event.id),
    ]);
    return NextResponse.json({ received: true });
  }
  if (!paidEvents.has(event.type) || session.payment_status === "unpaid") {
    return NextResponse.json({ received: true });
  }

  const order = await env.STORE_DB.prepare(
    "SELECT player_uuid, fulfillment_json, mode FROM store_orders WHERE order_id = ?",
  )
    .bind(orderId)
    .first<{
      player_uuid: string;
      fulfillment_json: string;
      mode: "test" | "live";
    }>();
  if (!order) {
    return NextResponse.json({ error: "order_not_found" }, { status: 500 });
  }
  const message: FulfillmentMessage = {
    order_id: orderId,
    session_id: session.id,
    player_uuid: order.player_uuid,
    amount_total: session.amount_total ?? 0,
    currency: session.currency ?? "jpy",
    mode: order.mode,
    products: JSON.parse(order.fulfillment_json) as FulfillmentProduct[],
    customer_email: session.customer_details?.email ?? undefined,
    payment_intent_id:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : undefined,
  };
  await env.STORE_FULFILLMENT_QUEUE.send(message);
  await env.STORE_DB.batch([
    env.STORE_DB.prepare(
      "UPDATE store_orders SET amount_total = ?, currency = ?, status = 'dispatch_pending', updated_at = ? WHERE order_id = ?",
    ).bind(message.amount_total, message.currency, now, orderId),
    env.STORE_DB.prepare(
      "UPDATE stripe_events SET status = 'queued', attempts = attempts + 1, updated_at = ? WHERE event_id = ?",
    ).bind(now, event.id),
  ]);
  return NextResponse.json({ received: true });
}

async function enqueueLegacySession(
  eventId: string,
  session: Stripe.Checkout.Session,
) {
  const payload = {
    event_id: eventId,
    session_id: session.id,
    amount_total: session.amount_total ?? 0,
    currency: session.currency ?? "jpy",
    customer_email: session.customer_details?.email ?? undefined,
    payment_intent_id:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : undefined,
  };
  const result = await callLegacyFulfillment(payload);
  if (!result.ok) throw new Error("Legacy fulfillment handoff failed");
}

async function callLegacyFulfillment(payload: unknown) {
  const { callStoreApi } = await import("@/lib/cloudflare-store");
  return (await callStoreApi("/internal/store/legacy-session/fulfill", payload))
    .response;
}
