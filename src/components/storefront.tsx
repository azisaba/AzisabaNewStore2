"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CircleAlert,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProductTags } from "@/lib/store-types";
import { ProductCard } from "./product-card";
import { useStore } from "./store-provider";

type ProductTab = "all" | "product" | "sara";
type SortMode = "featured" | "price-asc" | "price-desc" | "name";

export function Storefront() {
  const { catalog, catalogError, player, playerLoading, setPlayerDialogOpen } =
    useStore();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<ProductTab>("all");
  const [tag, setTag] = useState("all");
  const [sort, setSort] = useState<SortMode>("featured");

  const tags = useMemo(
    () =>
      [...new Set(catalog.flatMap(getProductTags))].sort((a, b) =>
        a.localeCompare(b, "ja"),
      ),
    [catalog],
  );

  const products = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ja");
    const filtered = catalog.filter((product) => {
      if (tab !== "all" && product.kind !== tab) return false;
      if (tag !== "all" && !getProductTags(product).includes(tag)) return false;
      if (!normalizedQuery) return true;
      return `${product.name} ${getProductTags(product).join(" ")}`
        .toLocaleLowerCase("ja")
        .includes(normalizedQuery);
    });
    if (sort === "price-asc")
      return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === "price-desc")
      return [...filtered].sort((a, b) => b.price - a.price);
    if (sort === "name")
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name, "ja"));
    return filtered;
  }, [catalog, query, tab, tag, sort]);

  return (
    <div>
      <section className="border-border/60 relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_20%,color-mix(in_oklch,var(--primary)_25%,transparent),transparent_35%),radial-gradient(circle_at_10%_80%,rgba(251,191,36,0.13),transparent_28%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1fr_0.68fr] lg:px-8">
          <div>
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/5 text-primary mb-5"
            >
              <Sparkles /> AZISABA OFFICIAL STORE
            </Badge>
            <h1 className="font-heading max-w-3xl text-4xl leading-tight font-black tracking-tight sm:text-5xl lg:text-6xl">
              いつものアジ鯖を、
              <br />
              <span className="text-primary">もっと自分らしく。</span>
            </h1>
            <p className="text-muted-foreground mt-6 max-w-2xl text-base leading-8 sm:text-lg">
              ランクやゲーム内アイテムを選び、Minecraft
              IDへ安全にお届けします。皿ランクは現在の所持ランクから差額でアップグレードできます。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() =>
                  document.getElementById("catalog")?.scrollIntoView()
                }
              >
                商品を見る <ArrowRight />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setPlayerDialogOpen(true)}
              >
                <UserRound />{" "}
                {player ? `${player.minecraftId} を変更` : "購入先を設定"}
              </Button>
            </div>
          </div>

          <div className="surface-panel relative self-end overflow-hidden rounded-2xl p-6 sm:p-8">
            <div className="bg-primary/10 absolute top-0 right-0 h-28 w-28 [clip-path:polygon(100%_0,100%_100%,0_0)]" />
            <p className="text-muted-foreground text-sm font-semibold">
              購入先プレイヤー
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="bg-primary/12 text-primary grid size-12 place-items-center rounded-xl">
                <UserRound />
              </div>
              <div>
                <p className="font-heading text-xl font-bold">
                  {playerLoading
                    ? "確認しています…"
                    : (player?.minecraftId ?? "未設定")}
                </p>
                <p className="text-muted-foreground text-sm">
                  {player
                    ? `現在の所持皿: ${player.highestSara.toLocaleString("ja-JP")}円皿`
                    : "設定すると皿ランクの差額が表示されます"}
                </p>
              </div>
            </div>
            <div className="bg-muted/70 text-muted-foreground mt-6 flex gap-3 rounded-xl p-4 text-sm">
              <ShieldCheck className="text-primary size-5 shrink-0" />
              この設定は購入先の確認にのみ使用され、アカウントへのログインやパスワード入力は行いません。
            </div>
          </div>
        </div>
      </section>

      <section
        id="catalog"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8"
      >
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-primary text-sm font-bold tracking-[0.16em]">
              PRODUCTS
            </p>
            <h2 className="font-heading mt-2 text-3xl font-black">
              商品を選ぶ
            </h2>
          </div>
          <p className="text-muted-foreground text-sm">
            {products.length}件の商品
          </p>
        </div>

        <div className="surface-panel mb-8 space-y-5 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="商品名やタグで検索"
                className="pl-9"
              />
            </div>
            <Select
              value={sort}
              onValueChange={(value) => setSort(value as SortMode)}
            >
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">おすすめ順</SelectItem>
                <SelectItem value="price-asc">価格が低い順</SelectItem>
                <SelectItem value="price-desc">価格が高い順</SelectItem>
                <SelectItem value="name">名前順</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as ProductTab)}
          >
            <TabsList className="h-auto w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">すべて</TabsTrigger>
              <TabsTrigger value="product">通常商品</TabsTrigger>
              <TabsTrigger value="sara">皿ランクアップ</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              size="sm"
              variant={tag === "all" ? "default" : "outline"}
              onClick={() => setTag("all")}
            >
              すべてのタグ
            </Button>
            {tags.map((item) => (
              <Button
                key={item}
                size="sm"
                variant={tag === item ? "default" : "outline"}
                onClick={() => setTag(item)}
                className="shrink-0"
              >
                {item}
              </Button>
            ))}
          </div>
        </div>

        {catalogError ? (
          <div className="surface-panel rounded-2xl p-10 text-center">
            <CircleAlert className="text-destructive mx-auto size-10" />
            <h3 className="font-heading mt-4 text-xl font-bold">
              商品を読み込めませんでした
            </h3>
            <p className="text-muted-foreground mt-2">
              時間をおいてページを再読み込みしてください。
            </p>
            <Button className="mt-5" onClick={() => location.reload()}>
              再読み込み
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="surface-panel rounded-2xl p-10 text-center">
            <Search className="text-muted-foreground mx-auto size-10" />
            <h3 className="font-heading mt-4 text-xl font-bold">
              条件に合う商品がありません
            </h3>
            <p className="text-muted-foreground mt-2">
              検索語やタグを変更してお試しください。
            </p>
            <Button
              className="mt-5"
              variant="outline"
              onClick={() => {
                setQuery("");
                setTag("all");
                setTab("all");
              }}
            >
              絞り込みを解除
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={`${product.kind}-${product.id}`}
                product={product}
              />
            ))}
          </div>
        )}

        <div className="text-muted-foreground mt-12 flex gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/8 p-5 text-sm leading-7">
          <CircleAlert className="mt-1 size-5 shrink-0 text-amber-500" />
          <p>
            購入をもって各種規約と注意事項に同意したものとみなされます。詳しくはページ下部の{" "}
            <Link
              href="https://www.azisaba.net/notes-on-donations/"
              target="_blank"
              className="text-foreground font-medium underline underline-offset-4"
            >
              寄付（購入）に関する注意
            </Link>{" "}
            をご確認ください。
          </p>
        </div>
      </section>
    </div>
  );
}
