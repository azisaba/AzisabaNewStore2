import { getCloudflareContext } from "@opennextjs/cloudflare";

export type StoreMode = "test" | "live";

type D1Result<T = unknown> = {
  results?: T[];
  success: boolean;
};

export type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
};

export type D1Database = {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
};

export type Queue<T> = {
  send(message: T): Promise<void>;
};

export type StoreCloudflareEnv = {
  STORE_DB: D1Database;
  STORE_FULFILLMENT_QUEUE: Queue<FulfillmentMessage>;
  STORE_API_ROOT: string;
  STORE_PUBLIC_ORIGIN: string;
  STORE_MODE: StoreMode;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STORE_API_HMAC_SECRET: string;
};

export type FulfillmentProduct =
  | { kind: "product"; delivery_id: string; id: number }
  | { kind: "sara"; delivery_id: string; amount: number };

export type FulfillmentMessage = {
  order_id: string;
  session_id: string;
  player_uuid: string;
  amount_total: number;
  currency: string;
  mode: StoreMode;
  products: FulfillmentProduct[];
  customer_email?: string;
  payment_intent_id?: string;
};

export function getStoreEnv(): StoreCloudflareEnv {
  return getCloudflareContext().env as unknown as StoreCloudflareEnv;
}

export function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256(value: string): Promise<string> {
  return bytesToHex(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

export async function createStoreSignature(
  secret: string,
  method: string,
  path: string,
  body: string,
  requestId = crypto.randomUUID(),
): Promise<Record<string, string>> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payloadHash = await sha256(body);
  const canonical = `${timestamp}\n${requestId}\n${method}\n${path}\n${payloadHash}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = bytesToHex(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(canonical)),
  );
  return {
    "Content-Type": "application/json",
    "X-Store-Timestamp": timestamp,
    "X-Store-Request-Id": requestId,
    "X-Store-Signature": signature,
  };
}

export async function callStoreApi<T>(
  path: string,
  payload: unknown,
): Promise<{ response: Response; data: T }> {
  const env = getStoreEnv();
  const body = JSON.stringify(payload);
  const response = await fetch(
    `${env.STORE_API_ROOT.replace(/\/$/, "")}${path}`,
    {
      method: "POST",
      headers: await createStoreSignature(
        env.STORE_API_HMAC_SECRET,
        "POST",
        path,
        body,
      ),
      body,
      cache: "no-store",
    },
  );
  const data = (await response.json()) as T;
  return { response, data };
}
