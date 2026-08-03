"use client";

import { useState } from "react";
import { CircleAlert, Loader2, LogOut, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { fetchPlayerStatus } from "@/lib/store-api";
import { useStore } from "./store-provider";

const MINECRAFT_ID_PATTERN = /^[A-Za-z0-9_]{3,16}$/;

export function PlayerDialog() {
  const {
    player,
    cartCount,
    playerDialogOpen,
    setPlayerDialogOpen,
    savePlayer,
    clearPlayer,
  } = useStore();
  const [minecraftId, setMinecraftId] = useState(player?.minecraftId ?? "");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  function beginConfirmation(event: React.FormEvent) {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const normalized = String(form.get("minecraftId") ?? "").trim();
    if (!MINECRAFT_ID_PATTERN.test(normalized)) {
      setError(
        "Minecraft IDは半角英数字とアンダースコア3〜16文字で入力してください。",
      );
      return;
    }
    setMinecraftId(normalized);
    setError("");
    setConfirming(true);
  }

  async function confirmPlayer() {
    setLoading(true);
    try {
      const status = await fetchPlayerStatus(minecraftId);
      savePlayer(status);
      setConfirming(false);
      setPlayerDialogOpen(false);
      toast.success(`${minecraftId} を購入先に設定しました。`);
    } catch (caught) {
      setConfirming(false);
      setError(
        caught instanceof Error
          ? caught.message
          : "プレイヤー情報を確認できませんでした。",
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearPlayer();
    setMinecraftId("");
    setPlayerDialogOpen(false);
    toast.success("購入先プレイヤーを解除しました。");
  }

  const changesPlayer = Boolean(player && player.minecraftId !== minecraftId);

  return (
    <>
      <Dialog open={playerDialogOpen} onOpenChange={setPlayerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserRoundCheck className="text-primary size-5" />{" "}
              購入先プレイヤー
            </DialogTitle>
            <DialogDescription>
              商品を受け取るMinecraft
              Java版のIDを設定します。これはアカウント認証ではありません。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={beginConfirmation} className="space-y-5">
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="minecraft-id">Minecraft ID</FieldLabel>
              <Input
                id="minecraft-id"
                name="minecraftId"
                defaultValue={player?.minecraftId ?? ""}
                placeholder="例: AzisabaPlayer"
                autoComplete="username"
                aria-invalid={Boolean(error)}
                autoFocus
              />
              <FieldDescription>
                大文字・小文字も正確にご入力ください。
              </FieldDescription>
              {error && <FieldError>{error}</FieldError>}
            </Field>
            <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-950 dark:text-amber-100">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              IDの入力間違いによる補填は原則できません。確定前にもう一度ご確認ください。
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              {player ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive"
                  onClick={logout}
                >
                  <LogOut /> 解除する
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit">入力内容を確認</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirming}
        onOpenChange={(open) => !loading && setConfirming(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              このMinecraft IDでよろしいですか？
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-foreground font-mono text-lg font-semibold">
                  {minecraftId}
                </p>
                <p>IDが存在することを確認してから保存します。</p>
                {changesPlayer && cartCount > 0 && (
                  <p className="text-destructive font-medium">
                    購入先の変更に伴い、現在のカートは空になります。
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>戻る</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPlayer} disabled={loading}>
              {loading && <Loader2 className="animate-spin" />} このIDに設定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
