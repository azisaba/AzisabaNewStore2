"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PlayerDialog } from "./player-dialog";
import { useStore } from "./store-provider";
import { ThemeToggle } from "./theme-toggle";

function StoreMark() {
  return (
    <span className="flex items-center gap-3">
      <span className="bg-primary text-primary-foreground relative grid size-9 place-items-center overflow-hidden rounded-lg text-sm font-black shadow-[0_0_24px_color-mix(in_oklch,var(--primary)_38%,transparent)]">
        A<span className="absolute right-0 bottom-0 size-2 bg-amber-400" />
      </span>
      <span className="leading-none">
        <span className="font-heading block text-base font-bold tracking-tight">
          アジ鯖ストア
        </span>
        <span className="text-muted-foreground mt-1 block text-[10px] font-semibold tracking-[0.2em]">
          AZISABA STORE
        </span>
      </span>
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { cartCount, player, playerLoading, setPlayerDialogOpen } = useStore();
  const links = [
    { href: "/", label: "商品一覧" },
    { href: "/cart", label: "カート" },
  ];

  return (
    <>
      <header className="border-border/70 bg-background/85 sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="アジ鯖ストア トップへ">
            <StoreMark />
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="メインナビゲーション"
          >
            {links.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                asChild
                className={cn(pathname === link.href && "bg-accent")}
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              className="hidden gap-2 sm:flex"
              onClick={() => setPlayerDialogOpen(true)}
            >
              <UserRound className="size-4" />
              <span className="max-w-36 truncate">
                {playerLoading
                  ? "確認中…"
                  : (player?.minecraftId ?? "購入先を設定")}
              </span>
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="relative hidden md:inline-flex"
              asChild
            >
              <Link href="/cart" aria-label={`カート、${cartCount}点`}>
                <ShoppingBag className="size-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 justify-center px-1 text-[10px]">
                    {cartCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="メニューを開く"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-left">
                    <StoreMark />
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 px-4">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setPlayerDialogOpen(true)}
                  >
                    <UserRound />{" "}
                    {player?.minecraftId ?? "購入先プレイヤーを設定"}
                  </Button>
                  {links.map((link) => (
                    <SheetClose key={link.href} asChild>
                      <Button
                        variant={pathname === link.href ? "secondary" : "ghost"}
                        className="justify-start"
                        asChild
                      >
                        <Link href={link.href}>
                          {link.href === "/cart" && <ShoppingBag />}
                          {link.label}
                          {link.href === "/cart" && cartCount > 0 && (
                            <Badge className="ml-auto">{cartCount}</Badge>
                          )}
                        </Link>
                      </Button>
                    </SheetClose>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <PlayerDialog />
    </>
  );
}
