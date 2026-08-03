import type { CartLine, ProductKind, StoreProduct } from "./store-types";

export const CART_STORAGE_KEY = "azisaba-store:cart:v1";
export const PLAYER_STORAGE_KEY = "azisaba-store:player:v1";

export function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Partial<CartLine>;
  return (
    (line.kind === "product" || line.kind === "sara") &&
    Number.isInteger(line.id) &&
    (line.id ?? 0) > 0 &&
    Number.isInteger(line.quantity) &&
    (line.quantity ?? 0) > 0
  );
}

export function parseStoredCart(value: string | null): CartLine[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isCartLine) : [];
  } catch {
    return [];
  }
}

export function reconcileCart(
  lines: CartLine[],
  catalog: StoreProduct[],
): CartLine[] {
  return lines
    .filter((line) =>
      catalog.some(
        (product) => product.kind === line.kind && product.id === line.id,
      ),
    )
    .map((line) => ({
      ...line,
      quantity: line.kind === "sara" ? 1 : Math.min(line.quantity, 99),
    }))
    .filter(
      (line, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.kind === line.kind && candidate.id === line.id,
        ) === index,
    )
    .filter(
      (line, index, all) =>
        line.kind !== "sara" ||
        all.findIndex((item) => item.kind === "sara") === index,
    );
}

export function addCartLine(
  lines: CartLine[],
  kind: ProductKind,
  id: number,
): CartLine[] {
  if (kind === "sara") {
    return [
      ...lines.filter((line) => line.kind !== "sara"),
      { kind, id, quantity: 1 },
    ];
  }

  const existing = lines.find((line) => line.kind === kind && line.id === id);
  if (!existing) return [...lines, { kind, id, quantity: 1 }];
  return lines.map((line) =>
    line === existing
      ? { ...line, quantity: Math.min(99, line.quantity + 1) }
      : line,
  );
}

export function updateCartQuantity(
  lines: CartLine[],
  kind: ProductKind,
  id: number,
  quantity: number,
): CartLine[] {
  if (quantity <= 0) return removeCartLine(lines, kind, id);
  return lines.map((line) =>
    line.kind === kind && line.id === id
      ? { ...line, quantity: line.kind === "sara" ? 1 : Math.min(99, quantity) }
      : line,
  );
}

export function removeCartLine(
  lines: CartLine[],
  kind: ProductKind,
  id: number,
): CartLine[] {
  return lines.filter((line) => line.kind !== kind || line.id !== id);
}
