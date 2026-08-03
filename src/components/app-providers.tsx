"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { StoreProduct } from "@/lib/store-types";
import { StoreProvider } from "./store-provider";

export function AppProviders({
  catalog,
  catalogError,
  children,
}: {
  catalog: StoreProduct[];
  catalogError: boolean;
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <StoreProvider catalog={catalog} catalogError={catalogError}>
          {children}
          <Toaster richColors position="top-center" />
        </StoreProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
