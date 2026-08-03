"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CircleAlert,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { API_ROOT, getCheckoutErrorMessage } from "@/lib/store-api";
import {
  formatYen,
  getDisplayPrice,
  getProductHref,
  type CheckoutResponse,
  type StoreProduct,
} from "@/lib/store-types";
import { ProductImage } from "./product-image";
import { useStore } from "./store-provider";

export function CartView() {
  const {
    cart,
    player,
    playerLoading,
    hydrated,
    findProduct,
    updateQuantity,
    removeFromCart,
    clearCart,
    setPlayerDialogOpen,
  } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const resolvedLines = useMemo(
    () =>
      cart
        .map((line) => ({ line, product: findProduct(line) }))
        .filter(
          (
            entry,
          ): entry is { line: (typeof cart)[number]; product: StoreProduct } =>
            entry.product !== undefined,
        ),
    [cart, findProduct],
  );
  const hasInvalidRank = resolvedLines.some(
    ({ product }) =>
      product.kind === "sara" &&
      getDisplayPrice(product, player?.highestSara) <= 0,
  );
  const total = resolvedLines.reduce(
    (sum, { line, product }) =>
      sum + getDisplayPrice(product, player?.highestSara) * line.quantity,
    0,
  );

  async function checkout() {
    if (!player) {
      setPlayerDialogOpen(true);
      return;
    }
    setLoading(true);
    setError("");
    const products = cart
      .filter((line) => line.kind === "product")
      .flatMap((line) => Array.from({ length: line.quantity }, () => line.id));
    const saraProducts = cart
      .filter((line) => line.kind === "sara")
      .map((line) => line.id);
    try {
      const response = await fetch(`${API_ROOT}/store/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: player.minecraftId,
          products,
          sara_products: saraProducts,
        }),
      });
      const result = (await response.json()) as CheckoutResponse;
      if ("error" in result)
        throw new Error(getCheckoutErrorMessage(result.error));
      if (!response.ok || !result.url)
        throw new Error("決済ページを作成できませんでした。");
      clearCart();
      window.location.assign(result.url);
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "決済を開始できませんでした。";
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
      </div>
    );
  }

  if (resolvedLines.length === 0) {
    return (
      <div className="mx-auto grid min-h-[65vh] max-w-2xl place-items-center px-4 py-16 text-center">
        <div>
          <div className="bg-primary/10 text-primary mx-auto grid size-20 place-items-center rounded-3xl">
            <ShoppingBag className="size-9" />
          </div>
          <h1 className="font-heading mt-6 text-3xl font-black">
            カートは空です
          </h1>
          <p className="text-muted-foreground mt-3">
            気になるランクやアイテムを探してみましょう。
          </p>
          <Button className="mt-7" size="lg" asChild>
            <Link href="/">
              <ArrowLeft /> 商品一覧を見る
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Button variant="ghost" asChild className="mb-5 -ml-3">
        <Link href="/">
          <ArrowLeft /> 買い物を続ける
        </Link>
      </Button>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-primary text-sm font-bold tracking-[0.16em]">
            YOUR CART
          </p>
          <h1 className="font-heading mt-2 text-3xl font-black sm:text-4xl">
            ショッピングカート
          </h1>
        </div>
        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={clearCart}
        >
          すべて削除
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {resolvedLines.map(({ line, product }) => {
            const unitPrice = getDisplayPrice(product, player?.highestSara);
            return (
              <Card
                key={`${line.kind}-${line.id}`}
                className="surface-panel py-0"
              >
                <CardContent className="grid gap-4 p-4 sm:grid-cols-[128px_1fr_auto] sm:items-center sm:p-5">
                  <Link href={getProductHref(product)}>
                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                      className="aspect-square rounded-xl"
                    />
                  </Link>
                  <div className="min-w-0">
                    <Badge variant="secondary">
                      {product.kind === "sara" ? "皿ランクアップ" : "通常商品"}
                    </Badge>
                    <Link
                      href={getProductHref(product)}
                      className="font-heading hover:text-primary mt-2 block text-lg font-bold"
                    >
                      {product.name}
                    </Link>
                    <p className="text-primary mt-1 font-semibold">
                      {formatYen(unitPrice)}
                    </p>
                    {product.kind === "sara" && player && (
                      <p className="text-muted-foreground text-xs">
                        {formatYen(product.price)} − 所持皿{" "}
                        {formatYen(player.highestSara)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    {product.kind === "product" ? (
                      <div className="bg-background flex items-center rounded-lg border">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() =>
                            updateQuantity(
                              line.kind,
                              line.id,
                              line.quantity - 1,
                            )
                          }
                          aria-label="数量を減らす"
                        >
                          <Minus />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {line.quantity}
                        </span>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() =>
                            updateQuantity(
                              line.kind,
                              line.id,
                              line.quantity + 1,
                            )
                          }
                          aria-label="数量を増やす"
                        >
                          <Plus />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        数量 1
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => removeFromCart(line.kind, line.id)}
                    >
                      <Trash2 /> 削除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="surface-panel gap-0 py-0">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl font-bold">ご注文内容</h2>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">商品点数</span>
                <span>
                  {cart.reduce((sum, line) => sum + line.quantity, 0)}点
                </span>
              </div>
              <Separator className="my-5" />
              <div className="flex items-end justify-between">
                <span className="font-semibold">合計</span>
                <span className="font-heading text-primary text-3xl font-black">
                  {formatYen(total)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setPlayerDialogOpen(true)}
                className="bg-background hover:border-primary/50 mt-6 flex w-full items-center gap-3 rounded-xl border p-4 text-left transition"
              >
                <UserRound className="text-primary size-5" />
                <span className="min-w-0">
                  <span className="text-muted-foreground block text-xs">
                    購入先プレイヤー
                  </span>
                  <span className="block truncate font-semibold">
                    {playerLoading
                      ? "確認中…"
                      : (player?.minecraftId ?? "未設定（設定してください）")}
                  </span>
                </span>
              </button>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <CircleAlert />
                  <AlertTitle>決済を開始できませんでした</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {hasInvalidRank && (
                <Alert variant="destructive" className="mt-4">
                  <CircleAlert />
                  <AlertTitle>購入できない皿ランクです</AlertTitle>
                  <AlertDescription>
                    商品を削除するか、購入先プレイヤーを変更してください。
                  </AlertDescription>
                </Alert>
              )}

              <Button
                size="lg"
                className="mt-6 w-full"
                onClick={checkout}
                disabled={loading || playerLoading || hasInvalidRank}
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <ShieldCheck />
                )}{" "}
                {player ? "Stripeで決済へ進む" : "購入先を設定して進む"}
              </Button>
              <p className="text-muted-foreground mt-4 text-center text-xs leading-5">
                決済ボタンを押すとStripeの安全な決済画面へ移動します。
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
