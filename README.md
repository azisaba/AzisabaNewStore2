# アジ鯖ストア

Next.js App Router、React、shadcn/uiで再設計したアジ鯖公式ストアです。商品情報とMinecraft ID確認はKtor API、Stripe CheckoutとWebhook署名検証はCloudflare Workerが担当します。

## ローカル開発

```powershell
Copy-Item .env.example .env.local
pnpm install
pnpm dev
```

既定のAPIは `https://api-ktor.azisaba.net` です。変更する場合は `NEXT_PUBLIC_API_ROOT` を設定してください。

## 検証

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm preview
```

`pnpm preview` はOpenNextでビルドし、Cloudflare Workersランタイム相当で起動します。Checkout APIはproductionで `https://newstore.azisaba.net`、test modeでlocalhostのOriginだけを受け付けます。

OpenNextはWindowsネイティブ環境との完全な互換性を保証していません。このプロジェクトでもWorkersバンドルは生成できますが、Windows版workerdのローカル実行では動的requireの制約により500となるため、Workersプレビューと最終確認はWSLまたはLinux CIで実行してください。

## Cloudflare Workers

Stripe秘密鍵はCloudflare Secretsにのみ登録します。D1・Queues・Secretsと段階移行の詳細は[Stripe移行手順](docs/stripe-migration.md)を参照してください。

`wrangler.jsonc` と `open-next.config.ts` を含んでいます。デプロイ前にWorker名、互換日付、カスタムドメイン、ビルド時環境変数を確認してください。

```powershell
pnpm cf-typegen
pnpm deploy
```
