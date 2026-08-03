# Azisaba Store Discord Bot

許可されたDiscord User IDだけが、Slash Commandからストア商品を管理できるCloudflare Workerです。DB操作はHMAC署名付きKotlin APIを通じてMariaDBへ反映されます。

## 設定

1. `wrangler.jsonc` の `DISCORD_ALLOWED_USER_IDS` をDiscord User IDのJSON配列へ変更します。
2. `DISCORD_PUBLIC_KEY` と `STORE_API_HMAC_SECRET` をCloudflare Secretsへ登録します。
3. Workerをdeployし、そのURLをDiscord ApplicationのInteractions Endpoint URLへ設定します。
4. `DISCORD_APPLICATION_ID`、`DISCORD_GUILD_ID`、`DISCORD_BOT_TOKEN` を現在のシェル環境へ設定し、`pnpm register-commands` を実行します。Bot Tokenはファイルへ保存しません。

Kotlin APIとBot Workerには同じ `STORE_API_HMAC_SECRET` を設定してください。

## コマンド

- `/store product list|create|update|delete`
- `/store sara list|create|update|delete`

create/updateはModalを開き、商品説明を複数行で入力できます。作成時の `hidden` は省略するとtrueです。削除には `confirm:true` が必要で、すべての変更は `store_admin_audit` に記録されます。
