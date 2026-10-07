"use client";

import { FileText, MessageCircleQuestionMark, Route } from "lucide-react";
import type { NavHref } from "./nav-items";

/** Capture uses the three-bar motif drawn as an outline icon, to match the set. */
function CaptureIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden>
      <path d="M7 9.5v5M12 5.5v13M17 8v8" />
    </svg>
  );
}

export function NavIcon({ href, size = 22 }: { href: NavHref; size?: number }) {
  switch (href) {
    case "/journey":
      return <Route size={size} aria-hidden />;
    case "/capture":
      return <CaptureIcon size={size} />;
    case "/records":
      return <FileText size={size} aria-hidden />;
    case "/ask":
      return <MessageCircleQuestionMark size={size} aria-hidden />;
  }
}
