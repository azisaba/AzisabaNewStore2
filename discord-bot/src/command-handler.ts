import { callStoreAdminApi } from "./store-api";
import type {
  Env,
  Interaction,
  InteractionOption,
  StoreProduct,
} from "./types";

export function parseAllowedUserIds(value: string): Set<string> {
  const parsed = JSON.parse(value) as unknown;
  if (
    !Array.isArray(parsed) ||
    parsed.some((id) => typeof id !== "string" || !/^\d{5,32}$/.test(id))
  ) {
    throw new Error("DISCORD_ALLOWED_USER_IDS must be a JSON string array");
  }
  return new Set(parsed);
}

function values(
  options: InteractionOption[] = [],
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    options
      .filter((option) => option.value !== undefined)
      .map((option) => [option.name, option.value!]),
  );
}

export function parseStoreCommand(interaction: Interaction): {
  action: "list" | "create" | "update" | "delete";
  payload: Record<string, unknown>;
} {
  const group = interaction.data?.options?.[0];
  const command = group?.options?.[0];
  if (interaction.data?.name !== "store" || !group || !command)
    throw new Error("unknown_command");
  if (group.name !== "product" && group.name !== "sara")
    throw new Error("unknown_product_kind");
  if (!["list", "create", "update", "delete"].includes(command.name))
    throw new Error("unknown_action");
  return {
    action: command.name as "list" | "create" | "update" | "delete",
    payload: { kind: group.name, ...values(command.options) },
  };
}

export function buildStoreModal(
  interaction: Interaction,
): Record<string, unknown> | null {
  const { action, payload } = parseStoreCommand(interaction);
  if (action !== "create" && action !== "update") return null;
  const kind = payload.kind as "product" | "sara";
  const id = action === "update" ? String(payload.id) : "0";
  const price = payload.price === undefined ? "-" : String(payload.price);
  const hidden =
    payload.hidden === undefined ? "-" : payload.hidden ? "1" : "0";
  const required = action === "create";
  const fields = [
    textInput("name", "商品名", 1, required, 128),
    textInput("description", "商品説明（複数行対応）", 2, required, 4000),
    textInput("image_url", "商品画像URL", 1, required, 1000),
    ...(kind === "product"
      ? [textInput("tags", "空白区切りのタグ", 1, required, 1000)]
      : []),
    textInput(
      "stripe_id",
      kind === "product" ? "Stripe Price ID" : "Stripe Product ID",
      1,
      required,
      128,
    ),
  ];
  return {
    type: 9,
    data: {
      custom_id: ["store", kind, action, id, price, hidden].join("|"),
      title: action === "create" ? "商品を追加" : `商品 #${id} を更新`,
      components: fields,
    },
  };
}

export async function executeStoreModal(
  interaction: Interaction,
  env: Env,
): Promise<string> {
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  if (!userId) throw new Error("user_not_found");
  const [prefix, kind, action, id, price, hidden] =
    interaction.data?.custom_id?.split("|") ?? [];
  if (
    prefix !== "store" ||
    (kind !== "product" && kind !== "sara") ||
    (action !== "create" && action !== "update")
  ) {
    throw new Error("invalid_modal");
  }
  const fields = Object.fromEntries(
    (interaction.data?.components ?? []).flatMap((row) =>
      (row.components ?? [])
        .filter(
          (component) => component.custom_id && component.value !== undefined,
        )
        .map((component) => [component.custom_id!, component.value!.trim()]),
    ),
  );
  const payload: Record<string, unknown> = {
    actor_user_id: userId,
    kind,
    ...Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== ""),
    ),
  };
  if (action === "update") payload.id = Number(id);
  if (price !== "-") payload.price = Number(price);
  if (hidden !== "-") payload.hidden = hidden === "1";
  const result = await callStoreAdminApi<{ product: StoreProduct }>(
    env,
    action,
    payload,
  );
  return `${action === "create" ? "追加" : "更新"}しました: #${result.product.id} ${result.product.name}（¥${result.product.price.toLocaleString("ja-JP")}）`;
}

function textInput(
  customId: string,
  label: string,
  style: 1 | 2,
  required: boolean,
  maxLength: number,
): Record<string, unknown> {
  return {
    type: 1,
    components: [
      {
        type: 4,
        custom_id: customId,
        label,
        style,
        required,
        max_length: maxLength,
      },
    ],
  };
}

export async function executeStoreCommand(
  interaction: Interaction,
  env: Env,
): Promise<string> {
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  if (!userId) throw new Error("user_not_found");
  const { action, payload } = parseStoreCommand(interaction);
  const request = { actor_user_id: userId, ...payload };
  if (action === "list") {
    const result = await callStoreAdminApi<{ products: StoreProduct[] }>(
      env,
      action,
      request,
    );
    if (!result.products.length) return "該当する商品はありません。";
    const lines = result.products.map(
      (product) =>
        `#${product.id} ${product.hidden ? "[非表示] " : ""}${product.name} — ¥${product.price.toLocaleString("ja-JP")} — ${product.stripe_id}`,
    );
    return truncate(lines.join("\n"));
  }
  const result = await callStoreAdminApi<{ product: StoreProduct }>(
    env,
    action,
    request,
  );
  const labels = { create: "追加", update: "更新", delete: "削除" } as const;
  return `${labels[action]}しました: #${result.product.id} ${result.product.name}（¥${result.product.price.toLocaleString("ja-JP")}）`;
}

function truncate(value: string): string {
  return value.length <= 1900
    ? value
    : `${value.slice(0, 1880)}\n…省略しました`;
}
