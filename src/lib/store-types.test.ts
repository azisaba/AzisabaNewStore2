import { describe, expect, it } from "vitest";
import {
  getDisplayPrice,
  getProductTags,
  productsResponseSchema,
} from "./store-types";

describe("store types", () => {
  it("所持皿との差額を0未満にしない", () => {
    const rank = {
      kind: "sara" as const,
      id: 1,
      name: "500円皿",
      description: "",
      price: 500,
      image_url: "",
      hidden: false,
      product_id: "prod",
    };
    expect(getDisplayPrice(rank, 100)).toBe(400);
    expect(getDisplayPrice(rank, 1000)).toBe(0);
  });

  it("空白区切りタグを重複なしで返す", () => {
    const product = {
      kind: "product" as const,
      id: 1,
      name: "Item",
      description: "",
      price: 100,
      image_url: "",
      hidden: false,
      tags: "Life  Life item",
      price_id: "price",
    };
    expect(getProductTags(product)).toEqual(["Life", "item"]);
  });

  it("APIレスポンスを境界で検証する", () => {
    expect(() =>
      productsResponseSchema.parse({
        products: [{ id: "1" }],
        sara_products: [],
      }),
    ).toThrow();
  });
});
