import type { ReactNode } from "react";
import { IconDefaults } from "./icon-defaults";
import { Sidebar } from "./sidebar";
import { TabBar } from "./tab-bar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <IconDefaults>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-body-sm text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <div className="min-h-dvh lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
        <Sidebar />
        <main id="main" tabIndex={-1} className="min-w-0 pb-[calc(4rem+env(safe-area-inset-bottom))] outline-none lg:pb-0">
          {children}
        </main>
      </div>
      <TabBar />
    </IconDefaults>
  );
}
