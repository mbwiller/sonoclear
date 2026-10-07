"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/ui/logo";
import { getPatientName } from "@/lib/care";
import { cn } from "@/lib/cn";
import { ClientOnly } from "./client-only";
import { NavIcon } from "./nav-icon";
import { activeTab, NAV_ITEMS } from "./nav-items";

function ProfileIdentity({ name, initials }: { name: string | null; initials: string | null }) {
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden className="grid size-9 place-items-center rounded-full border border-line bg-surface font-display text-[0.95rem] text-ink">
        {initials}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="min-h-5 text-body-sm font-medium text-ink">{name}</span>
        <span className="text-caption text-ink-muted">Profile</span>
      </span>
    </span>
  );
}

/** The patient's name comes from her data, which only exists in the browser. */
function PatientIdentity() {
  const { full, initials } = getPatientName();
  return <ProfileIdentity name={full} initials={initials} />;
}

function SidebarInner({ pathname }: { pathname: string | null }) {
  const active = activeTab(pathname);
  const onProfile = pathname?.startsWith("/profile") ?? false;
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line px-5 pb-6 pt-8 lg:flex">
      <Link href="/journey" className="mb-10 self-start rounded-lg px-3 py-1" aria-label="Sonoclear, go to Journey">
        <Logo />
      </Link>
      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.href && !onProfile;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-full px-4 text-body-sm font-medium transition-colors duration-200",
                    isActive ? "bg-sage-soft text-ink" : "text-ink-muted hover:bg-sunken hover:text-ink",
                  )}
                >
                  <NavIcon href={item.href} size={20} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto">
        <Link
          href="/profile"
          aria-current={onProfile ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-4 transition-colors duration-200",
            onProfile ? "bg-sage-soft" : "hover:bg-sunken",
          )}
        >
          <ClientOnly fallback={<ProfileIdentity name={null} initials={null} />}>
            <PatientIdentity />
          </ClientOnly>
        </Link>
      </div>
    </aside>
  );
}

function SidebarWithPath() {
  return <SidebarInner pathname={usePathname()} />;
}

/** Desktop navigation. */
export function Sidebar() {
  return (
    <Suspense fallback={<SidebarInner pathname={null} />}>
      <SidebarWithPath />
    </Suspense>
  );
}
