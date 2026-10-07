"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/cn";
import { NavIcon } from "./nav-icon";
import { activeTab, NAV_ITEMS } from "./nav-items";

function TabBarInner({ active }: { active: string | null }) {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper pb-safe lg:hidden">
      <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.href;
          return (
            <li key={item.href} className="relative">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 rounded-none text-[0.75rem] font-medium tracking-[0.01em] transition-colors duration-200",
                  isActive ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-0 h-[2px] w-7 rounded-full bg-sage transition-opacity duration-300",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                />
                <NavIcon href={item.href} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TabBarWithPath() {
  return <TabBarInner active={activeTab(usePathname())} />;
}

/** Mobile bottom navigation. */
export function TabBar() {
  return (
    <Suspense fallback={<TabBarInner active={null} />}>
      <TabBarWithPath />
    </Suspense>
  );
}
