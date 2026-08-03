import Link from "next/link";

const legalLinks = [
  ["利用規約", "https://www.azisaba.net/terms/"],
  ["プライバシーポリシー", "https://www.azisaba.net/privacy-policy/"],
  [
    "特定商取引法に基づく表記",
    "https://gist.github.com/acrylic-style/f8291fd460de5bcea60108e5be7009ea",
  ],
  ["寄付（購入）に関する注意", "https://www.azisaba.net/notes-on-donations/"],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-border/70 bg-card/35 mt-auto border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="font-heading font-bold">アジ鯖ストア</p>
            <p className="text-muted-foreground mt-1 text-sm">
              購入前に各規約と注意事項をご確認ください。
            </p>
          </div>
          <nav
            className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-2 text-sm"
            aria-label="規約・ポリシー"
          >
            {legalLinks.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-muted-foreground text-xs">
          © Azisaba Network. MinecraftはMojang Studiosの商標です。
        </p>
      </div>
    </footer>
  );
}
