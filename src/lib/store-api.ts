import { cache } from "react";
import {
  playerStatusSchema,
  productsResponseSchema,
  type PlayerStatus,
} from "./store-types";

export const API_ROOT =
  process.env.NEXT_PUBLIC_API_ROOT?.replace(/\/$/, "") ??
  "https://api-ktor.azisaba.net";

export class StoreApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "StoreApiError";
  }
}

export const getProducts = cache(async () => {
  const response = await fetch(`${API_ROOT}/store/products`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new StoreApiError(
      "商品一覧を取得できませんでした。",
      response.status,
    );
  }

  return productsResponseSchema.parse(await response.json());
});

export async function fetchPlayerStatus(
  minecraftId: string,
): Promise<PlayerStatus> {
  const response = await fetch(
    `${API_ROOT}/store/players/${encodeURIComponent(minecraftId)}/highest_sara`,
  );

  if (!response.ok) {
    throw new StoreApiError(
      "プレイヤー情報を確認できませんでした。",
      response.status,
    );
  }

  const status = playerStatusSchema.parse(await response.json());
  if (status.highest_sara === null) {
    throw new StoreApiError("そのMinecraft IDは見つかりませんでした。", 404);
  }

  return {
    minecraftId,
    highestSara: status.highest_sara,
    gamingSara: status.gaming_sara,
  };
}

export const CHECKOUT_ERROR_MESSAGES: Record<string, string> = {
  name_not_found:
    "購入先のMinecraft IDを確認できませんでした。もう一度設定してください。",
  already_has_gaming_sara:
    "このプレイヤーはすでにゲーミングランクを所持しています。",
  invalid_sara:
    "皿ランクの差額が変わりました。商品情報を再読み込みしてください。",
  too_many_sara: "皿ランクアップ商品は一度に1つだけ購入できます。",
  invalid_referer:
    "このページから決済を開始できませんでした。正規のストアURLをご確認ください。",
};

export function getCheckoutErrorMessage(code: string): string {
  return (
    CHECKOUT_ERROR_MESSAGES[code] ?? `決済を開始できませんでした（${code}）。`
  );
}
