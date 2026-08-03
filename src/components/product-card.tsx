"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  formatYen,
  getDisplayPrice,
  getProductHref,
  getProductTags,
  type StoreProduct,
} from "@/lib/store-types";
import { ProductActions } from "./product-actions";
import { ProductImage } from "./product-image";
import { useStore } from "./store-provider";

export function ProductCard({ product }: { product: StoreProduct }) {
  const { player, playerLoading } = useStore();
  const displayPrice = getDisplayPrice(product, player?.highestSara);
  const unavailable =
    product.kind === "sara" && player && !playerLoading && displayPrice <= 0;

  return (
    <Card className="group border-border/70 bg-card/90 hover:border-primary/45 gap-0 overflow-hidden py-0 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_-38px_color-mix(in_oklch,var(--primary)_55%,transparent)]">
      <Link
        href={getProductHref(product)}
        className="focus-visible:ring-ring block focus-visible:ring-2 focus-visible:outline-none"
      >
        <ProductImage
          src={product.image_url}
          alt={product.name}
          className="border-border/60 aspect-square border-b"
        />
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            {getProductTags(product)
              .slice(0, 3)
              .map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
          </div>
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-heading text-lg leading-snug font-bold">
              {product.name}
            </h2>
            <ArrowUpRight className="text-muted-foreground group-hover:text-primary mt-0.5 size-4 shrink-0 transition" />
          </div>
          <div>
            {product.kind === "sara" && player && displayPrice > 0 && (
              <p className="text-muted-foreground text-xs">所持皿との差額</p>
            )}
            <p className="font-heading text-primary text-2xl font-bold">
              {unavailable ? "購入済み" : formatYen(displayPrice)}
            </p>
            {product.kind === "sara" && !player && (
              <p className="text-muted-foreground mt-1 text-xs">
                購入先設定後に差額を計算します
              </p>
            )}
          </div>
        </CardContent>
      </Link>
      <CardFooter className="mt-auto p-5 pt-0">
        <ProductActions product={product} compact />
      </CardFooter>
    </Card>
  );
}
