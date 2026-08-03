import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import {
  checkoutRequestSchema,
  preparedCheckoutSchema,
} from "@/lib/checkout-schema";
import { callStoreApi, getStoreEnv } from "@/lib/cloudflare-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const env = getStoreEnv();
  const origin = request.headers.get("origin");
  const allowedOrigin = env.STORE_PUBLIC_ORIGIN.replace(/\/$/, "");
  const requestOrigin = origin?.replace(/\/$/, "");
  const localAllowed =
    env.STORE_MODE === "test" && requestOrigin?.startsWith("http://localhost:");
  if (requestOrigin !== allowedOrigin && !localAllowed) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 400 });
  }

  const input = await request.json().catch(() => null);
  const parsed = checkoutRequestSchema.safeParse(input);
  if (
    !parsed.success ||
    (!parsed.data.products.length && !parsed.data.sara_products.length)
  ) {
    return NextResponse.json({ error: "invalid_products" }, { status: 400 });
  }

  const orderId = crypto.randomUUID();
  const preparedResult = await callStoreApi<unknown>(
    "/internal/store/checkout/prepare",
    { order_id: orderId, ...parsed.data },
  );
  if (!preparedResult.response.ok) {
    return NextResponse.json(preparedResult.data, {
      status:
        preparedResult.response.status >= 400 &&
        preparedResult.response.status < 500
          ? preparedResult.response.status
          : 502,
    });
  }
  const prepared = preparedCheckoutSchema.parse(preparedResult.data);
  const products = prepared.products.map((product) => ({
    ...product,
    delivery_id: crypto.randomUUID(),
  }));
  const now = Math.floor(Date.now() / 1000);
  await env.STORE_DB.prepare(
    `INSERT INTO store_orders
      (order_id, player_uuid, currency, mode, status, fulfillment_json, created_at, updated_at)
     VALUES (?, ?, 'jpy', ?, 'preparing', ?, ?, ?)`,
  )
    .bind(
      orderId,
      prepared.player_uuid,
      env.STORE_MODE,
      JSON.stringify(products),
      now,
      now,
    )
    .run();

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
    timeout: 15_000,
    maxNetworkRetries: 1,
  });
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    prepared.line_items.map((line) =>
      line.kind === "price"
        ? { price: line.price_id, quantity: line.quantity }
        : {
            quantity: 1,
            price_data: {
              currency: "jpy",
              product: line.product_id,
              unit_amount: line.unit_amount,
            },
          },
    );
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: lineItems,
        allow_promotion_codes: true,
        success_url: `${allowedOrigin}/cart?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${allowedOrigin}/cart?checkout=cancelled`,
        metadata: { order_id: orderId, store_mode: env.STORE_MODE },
      },
      { idempotencyKey: orderId },
    );
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("Stripe Checkout Session creation failed", {
        type: error.type,
        code: error.code,
        requestId: error.requestId,
        statusCode: error.statusCode,
      });
    } else {
      console.error("Stripe Checkout Session creation failed", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
    }
    await env.STORE_DB.prepare(
      "UPDATE store_orders SET status = 'checkout_failed', updated_at = ? WHERE order_id = ?",
    )
      .bind(Math.floor(Date.now() / 1000), orderId)
      .run();
    return NextResponse.json(
      { error: "checkout_unavailable" },
      { status: 502 },
    );
  }
  if (!session.url) {
    return NextResponse.json(
      { error: "checkout_unavailable" },
      { status: 502 },
    );
  }
  await env.STORE_DB.prepare(
    "UPDATE store_orders SET stripe_session_id = ?, status = 'checkout_created', updated_at = ? WHERE order_id = ?",
  )
    .bind(session.id, Math.floor(Date.now() / 1000), orderId)
    .run();
  return NextResponse.json({ url: session.url });
}
