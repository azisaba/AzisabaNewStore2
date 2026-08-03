import { z } from "zod";

export const checkoutRequestSchema = z.object({
  name: z.string().trim().min(1).max(32),
  products: z.array(z.number().int().positive()).max(100),
  sara_products: z.array(z.number().int().positive()).max(1),
});

export const preparedCheckoutSchema = z.object({
  player_uuid: z.string().uuid(),
  line_items: z.array(
    z.union([
      z.object({
        kind: z.literal("price"),
        price_id: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
      z.object({
        kind: z.literal("sara"),
        product_id: z.string().min(1),
        unit_amount: z.number().int().positive(),
      }),
    ]),
  ),
  products: z.array(
    z.union([
      z.object({ kind: z.literal("product"), id: z.number().int().positive() }),
      z.object({
        kind: z.literal("sara"),
        amount: z.number().int().positive(),
      }),
    ]),
  ),
});

export type PreparedCheckout = z.infer<typeof preparedCheckoutSchema>;
