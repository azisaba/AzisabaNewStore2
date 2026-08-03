"use client";

import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 py-16 text-center">
      <div>
        <CircleAlert className="text-destructive mx-auto size-12" />
        <h1 className="font-heading mt-5 text-3xl font-black">
          ページを表示できませんでした
        </h1>
        <p className="text-muted-foreground mt-3 leading-7">
          通信状況をご確認のうえ、もう一度お試しください。
        </p>
        <Button className="mt-6" onClick={reset}>
          もう一度試す
        </Button>
      </div>
    </div>
  );
}
