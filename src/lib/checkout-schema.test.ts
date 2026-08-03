import { describe, expect, it } from "vitest";

import {
  checkoutRequestSchema,
  preparedCheckoutSchema,
} from "./checkout-schema";

describe("checkoutRequestSchema", () => {
  it("accepts the existing cart contract", () => {
    expect(
      checkoutRequestSchema.parse({
        name: "AzisabaPlayer",
        products: [1, 1, 2],
        sara_products: [3],
      }),
    ).toEqual({
      name: "AzisabaPlayer",
      products: [1, 1, 2],
      sara_products: [3],
    });
  });

  it("rejects multiple Sara ranks and oversized carts", () => {
    expect(
      checkoutRequestSchema.safeParse({
        name: "AzisabaPlayer",
        products: [],
        sara_products: [1, 2],
      }).success,
    ).toBe(false);
    expect(
      checkoutRequestSchema.safeParse({
        name: "AzisabaPlayer",
        products: Array.from({ length: 101 }, () => 1),
        sara_products: [],
      }).success,
    ).toBe(false);
  });
});

describe("preparedCheckoutSchema", () => {
  it("requires server-normalized Stripe and fulfillment data", () => {
    expect(
      preparedCheckoutSchema.safeParse({
        player_uuid: "550e8400-e29b-41d4-a716-446655440000",
        line_items: [{ kind: "price", price_id: "price_test", quantity: 2 }],
        products: [{ kind: "product", id: 1 }],
      }).success,
    ).toBe(true);
  });
});
