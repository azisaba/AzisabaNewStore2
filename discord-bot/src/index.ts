import { verifyKey } from "discord-interactions";

import {
  buildStoreModal,
  executeStoreCommand,
  executeStoreModal,
  parseAllowedUserIds,
} from "./command-handler";
import type { Env, ExecutionContext, Interaction } from "./types";

const EPHEMERAL = 1 << 6;

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function editResponse(
  interaction: Interaction,
  content: string,
): Promise<void> {
  await fetch(
    `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
    },
  );
}

function safeError(error: unknown): string {
  const code = error instanceof Error ? error.message : "unknown_error";
  const messages: Record<string, string> = {
    delete_confirmation_required: "削除には confirm:true が必要です。",
    product_not_found: "商品が見つかりません。",
    no_changes: "変更項目を1つ以上指定してください。",
    invalid_request: "入力内容が不正です。",
  };
  return `操作に失敗しました: ${messages[code] ?? code}`;
}

const worker = {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    if (request.method === "GET") return json({ status: "ok" });
    if (request.method !== "POST")
      return new Response("Method Not Allowed", { status: 405 });
    const signature = request.headers.get("X-Signature-Ed25519");
    const timestamp = request.headers.get("X-Signature-Timestamp");
    const body = await request.text();
    if (
      !signature ||
      !timestamp ||
      !(await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY))
    ) {
      return new Response("invalid request signature", { status: 401 });
    }
    const interaction = JSON.parse(body) as Interaction;
    if (interaction.type === 1) return json({ type: 1 });
    if (interaction.type !== 2 && interaction.type !== 5)
      return json({
        type: 4,
        data: { content: "未対応の操作です。", flags: EPHEMERAL },
      });
    const userId = interaction.member?.user?.id ?? interaction.user?.id;
    let allowed: Set<string>;
    try {
      allowed = parseAllowedUserIds(env.DISCORD_ALLOWED_USER_IDS);
    } catch {
      return json({
        type: 4,
        data: { content: "Botの許可User ID設定が不正です。", flags: EPHEMERAL },
      });
    }
    if (!userId || !allowed.has(userId)) {
      return json({
        type: 4,
        data: { content: "この操作を行う権限がありません。", flags: EPHEMERAL },
      });
    }
    if (interaction.type === 2) {
      try {
        const modal = buildStoreModal(interaction);
        if (modal) return json(modal);
      } catch (error) {
        return json({
          type: 4,
          data: { content: safeError(error), flags: EPHEMERAL },
        });
      }
    }
    ctx.waitUntil(
      (interaction.type === 5
        ? executeStoreModal(interaction, env)
        : executeStoreCommand(interaction, env)
      )
        .then((message) => editResponse(interaction, message))
        .catch((error) => editResponse(interaction, safeError(error))),
    );
    return json({ type: 5, data: { flags: EPHEMERAL } });
  },
};

export default worker;
