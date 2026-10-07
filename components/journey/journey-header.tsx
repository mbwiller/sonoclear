"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/layout";
import { Logo } from "@/components/ui/logo";
import { formatLongDate, greetingFor } from "@/lib/dates";
import type { Patient } from "@/lib/types";

/**
 * Greeting, today's date, and the way to her profile.
 * Phones: the mark and avatar share the top row. Desktop: the avatar sits beside the greeting.
 */
export function JourneyHeader({ patient, today }: { patient: Patient; today: string }) {
  const initials = `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`;
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6">
      {/* There is no sidebar on phones, so the mark lives here. */}
      <Logo size="sm" className="col-start-1 row-start-1 lg:hidden" />
      <Link
        href="/profile"
        aria-label="Profile"
        className="col-start-2 row-start-1 justify-self-end rounded-full transition-opacity duration-200 hover:opacity-80 lg:mt-1 lg:self-start"
      >
        <Avatar initials={initials} />
      </Link>
      <h1 className="col-span-2 mt-9 font-display text-display-xl text-ink text-balance lg:col-span-1 lg:col-start-1 lg:row-start-1 lg:mt-0 lg:text-[3.25rem] lg:leading-[1.04]">
        {greetingFor()}, {patient.firstName}
      </h1>
      <p className="col-span-2 mt-2.5 text-body text-ink-muted lg:col-span-1 lg:mt-3">{formatLongDate(today)}</p>
    </header>
  );
}
