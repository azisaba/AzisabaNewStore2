import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 py-16 text-center">
      <div>
        <SearchX className="text-muted-foreground mx-auto size-12" />
        <p className="font-heading text-primary mt-5 text-sm font-bold tracking-[0.18em]">
          404 NOT FOUND
        </p>
        <h1 className="font-heading mt-2 text-3xl font-black">
          商品が見つかりません
        </h1>
        <p className="text-muted-foreground mt-3 leading-7">
          販売が終了したか、URLが正しくない可能性があります。
        </p>
        <Button className="mt-6" asChild>
          <Link href="/">商品一覧へ戻る</Link>
        </Button>
      </div>
    </div>
  );
}
