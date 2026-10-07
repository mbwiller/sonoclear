"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Page, PageTitle } from "@/components/ui/layout";
import { STORAGE_KEY } from "@/lib/store";

/**
 * If a screen can't load, offer a calm way out. Saved changes are the most likely cause,
 * so the remedy is starting the demo fresh.
 */
export default function ErrorPage({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const startFresh = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable: a reload still clears the in-memory state.
    }
    window.location.reload();
  };

  return (
    <Page width="note" className="pt-16 lg:pt-28">
      <PageTitle>This page couldn&apos;t open</PageTitle>
      <p className="mt-4 text-body text-ink-muted text-pretty">
        Something in the changes saved in this browser didn&apos;t load. Starting the demo fresh clears them and opens this
        page again.
      </p>
      <Button className="mt-8" onClick={startFresh}>
        Start the demo fresh
      </Button>
    </Page>
  );
}
