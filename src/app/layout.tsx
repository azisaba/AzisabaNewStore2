import type { Metadata } from "next";
import { Noto_Sans_JP, Outfit } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getProducts } from "@/lib/store-api";
import { toStoreProducts, type StoreProduct } from "@/lib/store-types";
import "./globals.css";

const notoSans = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://newstore.azisaba.net"),
  title: {
    default: "アジ鯖ストア",
    template: "%s | アジ鯖ストア",
  },
  description: "アジ鯖のランクやゲーム内アイテムを購入できる公式ストアです。",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let catalog: StoreProduct[] = [];
  let catalogError = false;
  try {
    catalog = toStoreProducts(await getProducts());
  } catch {
    catalogError = true;
  }

  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${notoSans.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AppProviders catalog={catalog} catalogError={catalogError}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
