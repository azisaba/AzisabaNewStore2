CREATE TABLE store_orders (
  order_id TEXT PRIMARY KEY,
  stripe_session_id TEXT UNIQUE,
  player_uuid TEXT NOT NULL,
  amount_total INTEGER,
  currency TEXT NOT NULL DEFAULT 'jpy',
  mode TEXT NOT NULL CHECK (mode IN ('test', 'live')),
  status TEXT NOT NULL,
  fulfillment_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE stripe_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  stripe_session_id TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX stripe_events_session_idx ON stripe_events (stripe_session_id);
