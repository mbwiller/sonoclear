import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

const WIDTHS = {
  /** Notes and documents: visit page, record page, Ask answers. */
  note: "max-w-[680px]",
  /** Single-column screens: Capture, Records list, Profile. */
  default: "max-w-[760px]",
  /** Journey on desktop. */
  wide: "max-w-[1120px]",
} as const;

/** Page content column with consistent gutters. */
export function Page({
  width = "default",
  className,
  children,
}: {
  width?: keyof typeof WIDTHS;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full px-5 pb-16 pt-6 sm:px-8 lg:px-12 lg:pb-24 lg:pt-14", WIDTHS[width], className)}>
      {children}
    </div>
  );
}

/** A quiet back link for detail pages. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full pl-1 pr-3 text-body-sm font-medium text-ink-muted transition-colors duration-200 hover:text-ink"
    >
      <ChevronLeft size={18} aria-hidden />
      {children}
    </Link>
  );
}

/** Serif page title. */
export function PageTitle({ children, className, ...rest }: ComponentProps<"h1">) {
  return (
    <h1 className={cn("font-display text-display-lg text-ink text-balance lg:text-[2.5rem]", className)} {...rest}>
      {children}
    </h1>
  );
}

/** Tracked uppercase section label. Renders an h2 by default. */
export function Eyebrow({
  as: Tag = "h2",
  className,
  children,
  id,
}: {
  as?: "h2" | "h3" | "p" | "span";
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <Tag id={id} className={cn("eyebrow", className)}>
      {children}
    </Tag>
  );
}

/** A note section: eyebrow heading, optional action, then content. */
export function Section({
  title,
  action,
  className,
  children,
  id,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section aria-labelledby={headingId} id={id} className={cn("scroll-mt-6", className)}>
      <div className="mb-3 flex min-h-6 items-center justify-between gap-4">
        <Eyebrow id={headingId}>{title}</Eyebrow>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Card surface: white, hairline, generous radius. No shadow. */
export function Card({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={cn("rounded-card border border-line bg-surface", className)} {...rest}>
      {children}
    </div>
  );
}

/** A 1px hairline. */
export function Hairline({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-line", className)} />;
}

/** Initials avatar. */
export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-11 place-items-center rounded-full border border-line bg-surface font-display text-[1.05rem] text-ink",
        className,
      )}
    >
      {initials}
    </span>
  );
}
