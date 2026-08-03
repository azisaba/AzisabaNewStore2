"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addCartLine,
  CART_STORAGE_KEY,
  parseStoredCart,
  PLAYER_STORAGE_KEY,
  reconcileCart,
  removeCartLine,
  updateCartQuantity,
} from "@/lib/cart";
import { fetchPlayerStatus } from "@/lib/store-api";
import type {
  CartLine,
  PlayerStatus,
  ProductKind,
  StoreProduct,
} from "@/lib/store-types";

type StoreContextValue = {
  catalog: StoreProduct[];
  catalogError: boolean;
  cart: CartLine[];
  cartCount: number;
  player: PlayerStatus | null;
  playerLoading: boolean;
  hydrated: boolean;
  playerDialogOpen: boolean;
  setPlayerDialogOpen: (open: boolean) => void;
  savePlayer: (player: PlayerStatus) => void;
  clearPlayer: () => void;
  refreshPlayer: () => Promise<void>;
  addToCart: (product: StoreProduct) => void;
  updateQuantity: (kind: ProductKind, id: number, quantity: number) => void;
  removeFromCart: (kind: ProductKind, id: number) => void;
  clearCart: () => void;
  findProduct: (
    line: Pick<CartLine, "kind" | "id">,
  ) => StoreProduct | undefined;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({
  catalog,
  catalogError,
  children,
}: {
  catalog: StoreProduct[];
  catalogError: boolean;
  children: ReactNode;
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [player, setPlayer] = useState<PlayerStatus | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedCart = reconcileCart(
        parseStoredCart(localStorage.getItem(CART_STORAGE_KEY)),
        catalog,
      );
      setCart(storedCart);

      const minecraftId = localStorage.getItem(PLAYER_STORAGE_KEY);
      if (minecraftId) {
        setPlayer({ minecraftId, highestSara: 0, gamingSara: false });
        setPlayerLoading(true);
        fetchPlayerStatus(minecraftId)
          .then(setPlayer)
          .catch(() => {
            localStorage.removeItem(PLAYER_STORAGE_KEY);
            setPlayer(null);
          })
          .finally(() => setPlayerLoading(false));
      }

      if (
        new URLSearchParams(window.location.search).get("player") === "edit"
      ) {
        setPlayerDialogOpen(true);
        window.history.replaceState({}, "", window.location.pathname);
      }
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [catalog]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const savePlayer = useCallback(
    (nextPlayer: PlayerStatus) => {
      if (player?.minecraftId && player.minecraftId !== nextPlayer.minecraftId)
        setCart([]);
      localStorage.setItem(PLAYER_STORAGE_KEY, nextPlayer.minecraftId);
      setPlayer(nextPlayer);
    },
    [player],
  );

  const clearPlayer = useCallback(() => {
    localStorage.removeItem(PLAYER_STORAGE_KEY);
    setPlayer(null);
    setCart([]);
  }, []);

  const refreshPlayer = useCallback(async () => {
    if (!player) return;
    setPlayerLoading(true);
    try {
      setPlayer(await fetchPlayerStatus(player.minecraftId));
    } finally {
      setPlayerLoading(false);
    }
  }, [player]);

  const value = useMemo<StoreContextValue>(
    () => ({
      catalog,
      catalogError,
      cart,
      cartCount: cart.reduce((total, line) => total + line.quantity, 0),
      player,
      playerLoading,
      hydrated,
      playerDialogOpen,
      setPlayerDialogOpen,
      savePlayer,
      clearPlayer,
      refreshPlayer,
      addToCart: (product) =>
        setCart((lines) => addCartLine(lines, product.kind, product.id)),
      updateQuantity: (kind, id, quantity) =>
        setCart((lines) => updateCartQuantity(lines, kind, id, quantity)),
      removeFromCart: (kind, id) =>
        setCart((lines) => removeCartLine(lines, kind, id)),
      clearCart: () => setCart([]),
      findProduct: (line) =>
        catalog.find(
          (product) => product.kind === line.kind && product.id === line.id,
        ),
    }),
    [
      catalog,
      catalogError,
      cart,
      player,
      playerLoading,
      hydrated,
      playerDialogOpen,
      savePlayer,
      clearPlayer,
      refreshPlayer,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used within StoreProvider");
  return value;
}
