import type { Metadata } from "next";
import { ClientOnly } from "@/components/shell/client-only";
import { JourneyScreen } from "@/components/journey/journey-screen";

export const metadata: Metadata = { title: "Journey" };

export default function Page() {
  return (
    <ClientOnly>
      <JourneyScreen />
    </ClientOnly>
  );
}
