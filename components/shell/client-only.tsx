"use client";

import { Suspense, use, type ReactNode } from "react";
import { browser } from "react-dom";

function BrowserGate({ children }: { children: ReactNode }) {
  use(browser("Patient data lives in this browser and dates are relative to the viewer's today."));
  return <div className="animate-fade-in">{children}</div>;
}

/**
 * Renders children only in the browser. Everything that reads the store or today's
 * date sits under this, so prerendered HTML never disagrees with the client.
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <Suspense fallback={fallback}>
      <BrowserGate>{children}</BrowserGate>
    </Suspense>
  );
}
