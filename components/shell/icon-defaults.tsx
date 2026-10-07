"use client";

import { LucideProvider } from "lucide-react";
import type { ReactNode } from "react";

/** One thin-stroke outline icon set, configured once (VISION §6). */
export function IconDefaults({ children }: { children: ReactNode }) {
  return (
    <LucideProvider strokeWidth={1.5} size={20}>
      {children}
    </LucideProvider>
  );
}
