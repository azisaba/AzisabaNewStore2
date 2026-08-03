import { describe, expect, it } from "vitest";

import { parseStoreApiResponse } from "./cloudflare-store";

describe("parseStoreApiResponse", () => {
  it("maps an empty backend response without throwing", async () => {
    await expect(
      parseStoreApiResponse(new Response(null, { status: 500 })),
    ).resolves.toEqual({ error: "store_backend_empty_response" });
  });

  it("maps a non-JSON backend response without exposing its body", async () => {
    await expect(
      parseStoreApiResponse(new Response("upstream failure", { status: 502 })),
    ).resolves.toEqual({ error: "store_backend_invalid_response" });
  });

  it("returns a JSON backend response", async () => {
    await expect(
      parseStoreApiResponse(
        new Response('{"error":"name_not_found"}', { status: 400 }),
      ),
    ).resolves.toEqual({ error: "name_not_found" });
  });
});
