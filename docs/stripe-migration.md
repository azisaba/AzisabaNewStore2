# Stripe Worker移行手順

Stripeの秘密値をリポジトリ、チャット、ログへ貼り付けないでください。SecretはCloudflareの対話入力で登録します。

## 1. 事前配備

1. `api` リポジトリの `common`、`spigot`、`server` をこの順で配備します。
2. Ktorの実行環境へ `STORE_WORKER_HMAC_SECRET` をKubernetes Secretなどから環境変数として設定します。
3. 全SpigotサーバーがRedis V2チャンネルを購読していることを確認します。
4. Ktorの `store_fulfillments` と `store_requests` テーブルが作成されたことを確認します。

この段階では既存Checkoutの受付を止めません。

## 2. Cloudflareリソース

1. D1 database `azisaba-new-store` を作成し、`wrangler.jsonc` の `database_id` を実値へ置換します。
2. Queue `azisaba-store-fulfillment` とdead-letter Queue `azisaba-store-fulfillment-dead-letter` を作成します。
3. `migrations/0001_store_orders.sql` を対象D1へ適用します。
4. production環境へ次のSecretを対話入力で登録します。
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STORE_API_HMAC_SECRET`
5. `STORE_API_HMAC_SECRET` はKtor側の共有Secretと同じ値にします。

test/liveはWorker環境、Stripe APIキー、Webhook endpoint、Webhook Secretを分離してください。

## 3. Stripe Webhook

Stripe Dashboardで `https://newstore.azisaba.net/api/stripe/webhook` を追加し、次だけを購読します。

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

新endpointのSigning secretを `STRIPE_WEBHOOK_SECRET` に登録します。Webhookが2xxを返し、D1の `stripe_events` に記録されることをtest modeで確認します。

## 4. Checkout切替

1. Workerを配備します。
2. カートが同一オリジンの `/api/store/checkout` を呼ぶことを確認します。
3. Stripe test modeでSession作成、Webhook、Queue、Ktor Outbox、Redis V2、Spigot付与を順に確認します。
4. live modeへ切り替え、少額の管理対象商品で監視付き確認を行います。

旧Ktorが作成したSessionには `order_id` metadataがありません。新WorkerはそのWebhookを `/internal/store/legacy-session/fulfill` へ渡し、旧 `PersistentDataStore` のSession明細を利用します。

## 5. 排出と撤去

1. 切替時刻から24時間以上待ち、Stripe Dashboardで旧Sessionの未完了・未配信イベントがないことを確認します。
2. `PersistentDataStore` に未処理の `session_` エントリーがないことを確認します。
3. 移行用 `/internal/store/legacy-session/fulfill` と旧Sessionデータを別リリースで撤去します。
4. 旧Stripe Webhook endpointを無効化します。
5. Kotlinの旧Stripe Secretを実行環境と構成管理から削除し、鍵をStripe Dashboardでローテーションします。

## ロールバック

- Checkout切替直後はフロントエンドだけを旧版へ戻せます。新Worker Webhookは残し、切替後に作られたSessionの付与を継続してください。
- Queue障害時はメッセージを削除せず、dead-letter QueueとKtor `store_fulfillments` の `failed` 行を照合します。
- `order_id` と `delivery_id` を調査キーに使います。商品付与コマンド中の停止は自動再試行されるため、まれに二重付与となり得ます。
