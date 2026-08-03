import { describe, expect, it } from "vitest";
import {
  addCartLine,
  parseStoredCart,
  reconcileCart,
  updateCartQuantity,
} from "./cart";
import type { StoreProduct } from "./store-types";

const catalog: StoreProduct[] = [
  {
    kind: "product",
    id: 1,
    name: "Item",
    description: "",
    price: 100,
    image_url: "",
    hidden: false,
    tags: "Life item",
    price_id: "price_1",
  },
  {
    kind: "sara",
    id: 2,
    name: "500円皿",
    description: "",
    price: 500,
    image_url: "",
    hidden: false,
    product_id: "prod_2",
  },
  {
    kind: "sara",
    id: 3,
    name: "1000円皿",
    description: "",
    price: 1000,
    image_url: "",
    hidden: false,
    product_id: "prod_3",
  },
];

describe("cart", () => {
  it("同じ通常商品を数量としてまとめる", () => {
    const once = addCartLine([], "product", 1);
    expect(addCartLine(once, "product", 1)).toEqual([
      { kind: "product", id: 1, quantity: 2 },
    ]);
  });

  it("皿ランク商品は既存の1件を置き換える", () => {
    const first = addCartLine([], "sara", 2);
    expect(addCartLine(first, "sara", 3)).toEqual([
      { kind: "sara", id: 3, quantity: 1 },
    ]);
  });

  it("破損したlocalStorage値を安全に無視する", () => {
    expect(parseStoredCart("not-json")).toEqual([]);
    expect(
      parseStoredCart('[{"kind":"product","id":1,"quantity":2},{"id":4}]'),
    ).toEqual([{ kind: "product", id: 1, quantity: 2 }]);
  });

  it("販売終了商品を除き、数量を上限へ丸める", () => {
    expect(
      reconcileCart(
        [
          { kind: "product", id: 1, quantity: 120 },
          { kind: "product", id: 99, quantity: 1 },
        ],
        catalog,
      ),
    ).toEqual([{ kind: "product", id: 1, quantity: 99 }]);
  });

  it("数量0で商品を削除する", () => {
    expect(
      updateCartQuantity(
        [{ kind: "product", id: 1, quantity: 1 }],
        "product",
        1,
        0,
      ),
    ).toEqual([]);
  });
});
