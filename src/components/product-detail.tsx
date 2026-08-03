"use client";

import Link from "next/link";
import { ArrowLeft, CircleAlert, ShieldCheck, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  formatYen,
  getDisplayPrice,
  getProductTags,
  type StoreProduct,
} from "@/lib/store-types";
import { ProductActions } from "./product-actions";
import { ProductImage } from "./product-image";
import { useStore } from "./store-provider";

export function ProductDetail({
  product,
  description,
}: {
  product: StoreProduct;
  description: string;
}) {
  const { player, playerLoading, setPlayerDialogOpen } = useStore();
  const displayPrice = getDisplayPrice(product, player?.highestSara);
  const unavailable =
    product.kind === "sara" && player && !playerLoading && displayPrice <= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Button variant="ghost" asChild className="mb-6 -ml-3">
        <Link href="/">
          <ArrowLeft /> 商品一覧へ戻る
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="space-y-8">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            priority
            className="surface-panel aspect-square max-h-[620px] rounded-2xl"
          />
          <section className="surface-panel rounded-2xl p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold">商品説明</h2>
            <Separator className="my-6" />
            {description ? (
              <div
                className="product-description"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            ) : (
              <p className="text-muted-foreground">
                この商品には追加の説明がありません。
              </p>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="surface-panel gap-0 overflow-hidden py-0">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-wrap gap-2">
                {getProductTags(product).map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="font-heading mt-5 text-3xl leading-tight font-black">
                {product.name}
              </h1>
              <div className="mt-8">
                {product.kind === "sara" ? (
                  <>
                    <div className="text-muted-foreground flex items-center justify-between text-sm">
                      <span>ランク価格</span>
                      <span>{formatYen(product.price)}</span>
                    </div>
                    <div className="text-muted-foreground mt-2 flex items-center justify-between text-sm">
                      <span>現在の所持皿</span>
                      <span>
                        {player ? formatYen(player.highestSara) : "未設定"}
                      </span>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-end justify-between gap-4">
                      <span className="font-medium">お支払い差額</span>
                      <span className="font-heading text-primary text-3xl font-black">
                        {unavailable
                          ? "購入不可"
                          : player
                            ? formatYen(displayPrice)
                            : "—"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-muted-foreground text-sm">価格</p>
                    <p className="font-heading text-primary mt-1 text-4xl font-black">
                      {formatYen(product.price)}
                    </p>
                  </div>
                )}
              </div>

              {product.kind === "sara" && !player && (
                <Button
                  variant="outline"
                  className="mt-6 h-auto w-full justify-start gap-3 py-4 text-left"
                  onClick={() => setPlayerDialogOpen(true)}
                >
                  <UserRound className="text-primary size-5 shrink-0" />
                  <span>
                    <span className="block font-semibold">
                      購入先プレイヤーを設定
                    </span>
                    <span className="text-muted-foreground mt-1 block text-xs font-normal">
                      所持皿を確認して差額を計算します
                    </span>
                  </span>
                </Button>
              )}

              <div className="mt-7">
                <ProductActions product={product} />
              </div>
              <div className="bg-muted/65 text-muted-foreground mt-5 flex gap-3 rounded-xl p-4 text-sm leading-6">
                <ShieldCheck className="text-primary mt-0.5 size-5 shrink-0" />
                決済はStripeの安全な決済画面で行われます。
              </div>
              {product.kind === "sara" && (
                <div className="text-muted-foreground mt-3 flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 p-4 text-sm leading-6">
                  <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-500" />
                  皿ランクアップ商品は、ほかの商品と合わせても一度に1件だけ購入できます。
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
