import type { Env } from "./types";

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(value: string): Promise<string> {
  return toHex(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

export async function callStoreAdminApi<T>(
  env: Env,
  action: "list" | "create" | "update" | "delete",
  payload: Record<string, unknown>,
): Promise<T> {
  const path = `/internal/store/admin/products/${action}`;
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const requestId = crypto.randomUUID();
  const canonical = `${timestamp}\n${requestId}\nPOST\n${path}\n${await sha256(body)}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.STORE_API_HMAC_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = toHex(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(canonical)),
  );
  const response = await fetch(
    `${env.STORE_API_ROOT.replace(/\/$/, "")}${path}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Store-Timestamp": timestamp,
        "X-Store-Request-Id": requestId,
        "X-Store-Signature": signature,
      },
      body,
    },
  );
  const text = await response.text();
  const data = text ? (JSON.parse(text) as T & { error?: string }) : null;
  if (!response.ok || !data) {
    throw new Error(data?.error ?? `store_api_${response.status}`);
  }
  return data;
}
