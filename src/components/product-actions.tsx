"use client";

import { useState } from "react";
import { ShoppingBag, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { getDisplayPrice, type StoreProduct } from "@/lib/store-types";
import { useStore } from "./store-provider";

export function ProductActions({
  product,
  compact = false,
}: {
  product: StoreProduct;
  compact?: boolean;
}) {
  const {
    cart,
    player,
    playerLoading,
    addToCart,
    setPlayerDialogOpen,
    findProduct,
  } = useStore();
  const [replaceOpen, setReplaceOpen] = useState(false);
  const existingRankLine = cart.find((line) => line.kind === "sara");
  const existingRank = existingRankLine
    ? findProduct(existingRankLine)
    : undefined;
  const displayPrice = getDisplayPrice(product, player?.highestSara);
  const cannotUpgrade =
    product.kind === "sara" &&
    Boolean(player) &&
    !playerLoading &&
    displayPrice <= 0;

  function add() {
    if (product.kind === "sara" && !player) {
      setPlayerDialogOpen(true);
      return;
    }
    if (
      existingRankLine &&
      product.kind === "sara" &&
      existingRankLine.id !== product.id
    ) {
      setReplaceOpen(true);
      return;
    }
    addToCart(product);
    toast.success(`${product.name} をカートに追加しました。`);
  }

  function replace() {
    addToCart(product);
    setReplaceOpen(false);
    toast.success(`${product.name} に入れ替えました。`);
  }

  return (
    <>
      <Button
        className={compact ? "w-full" : "h-12 w-full text-base"}
        onClick={add}
        disabled={cannotUpgrade || playerLoading}
      >
        {product.kind === "sara" && !player ? <UserRound /> : <ShoppingBag />}
        {cannotUpgrade
          ? "現在の皿から購入できません"
          : product.kind === "sara" && !player
            ? "購入先を設定して差額を見る"
            : "カートに追加"}
      </Button>
      <AlertDialog open={replaceOpen} onOpenChange={setReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>皿ランク商品を入れ替えますか？</AlertDialogTitle>
            <AlertDialogDescription>
              カート内の「{existingRank?.name ?? "皿ランク商品"}」を「
              {product.name}
              」へ置き換えます。皿ランクアップ商品は一度に1件だけ購入できます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={replace}>入れ替える</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
