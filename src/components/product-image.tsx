"use client";

import { useState } from "react";
import Image from "next/image";
import { Box } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("bg-muted relative overflow-hidden", className)}>
      {!src || failed ? (
        <div className="text-muted-foreground absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_center,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_68%)]">
          <div className="text-center">
            <Box className="mx-auto size-12 opacity-55" />
            <span className="mt-2 block text-xs">NO IMAGE</span>
          </div>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.04]"
          priority={priority}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
