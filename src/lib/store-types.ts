import { z } from "zod";

const baseProductSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  description: z.string(),
  price: z.number().int().nonnegative(),
  image_url: z.string(),
  hidden: z.boolean(),
});

export const productSchema = baseProductSchema.extend({
  tags: z.string(),
  price_id: z.string(),
});

export const saraProductSchema = baseProductSchema.extend({
  product_id: z.string(),
});

export const productsResponseSchema = z.object({
  products: z.array(productSchema),
  sara_products: z.array(saraProductSchema),
});

export const playerStatusSchema = z.object({
  highest_sara: z.number().int().nonnegative().nullable(),
  gaming_sara: z.boolean(),
});

export type Product = z.infer<typeof productSchema>;
export type SaraProduct = z.infer<typeof saraProductSchema>;
export type ProductsResponse = z.infer<typeof productsResponseSchema>;

export type ProductKind = "product" | "sara";

export type StoreProduct =
  (Product & { kind: "product" }) | (SaraProduct & { kind: "sara" });

export type PlayerStatus = {
  minecraftId: string;
  highestSara: number;
  gamingSara: boolean;
};

export type CartLine = {
  kind: ProductKind;
  id: number;
  quantity: number;
};

export type CheckoutRequest = {
  name: string;
  products: number[];
  sara_products: number[];
};

export type CheckoutResponse = { url: string } | { error: string };

export function toStoreProducts(response: ProductsResponse): StoreProduct[] {
  return [
    ...response.products.map((product) => ({
      ...product,
      kind: "product" as const,
    })),
    ...response.sara_products.map((product) => ({
      ...product,
      kind: "sara" as const,
    })),
  ];
}

export function getProductTags(product: StoreProduct): string[] {
  if (product.kind === "sara") return ["皿ランク"];
  return [
    ...new Set(
      product.tags
        .split(/\s+/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
}

export function getProductHref(
  product: Pick<StoreProduct, "kind" | "id">,
): string {
  return product.kind === "sara"
    ? `/sara-products/${product.id}`
    : `/products/${product.id}`;
}

export function getDisplayPrice(
  product: StoreProduct,
  highestSara?: number,
): number {
  if (product.kind === "product") return product.price;
  return Math.max(0, product.price - (highestSara ?? 0));
}

export function formatYen(value: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}
