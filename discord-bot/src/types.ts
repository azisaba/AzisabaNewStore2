export type Env = {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_ALLOWED_USER_IDS: string;
  STORE_API_ROOT: string;
  STORE_API_HMAC_SECRET: string;
};

export type ExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
};

export type InteractionOption = {
  name: string;
  type: number;
  value?: string | number | boolean;
  options?: InteractionOption[];
};

export type Interaction = {
  id: string;
  application_id: string;
  type: number;
  token: string;
  member?: { user?: { id: string } };
  user?: { id: string };
  data?: {
    name?: string;
    options?: InteractionOption[];
    custom_id?: string;
    components?: Array<{
      components?: Array<{ custom_id?: string; value?: string }>;
    }>;
  };
};

export type StoreProduct = {
  kind: "product" | "sara";
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  hidden: boolean;
  tags?: string;
  stripe_id: string;
};
