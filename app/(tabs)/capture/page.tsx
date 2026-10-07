import type { Metadata } from "next";
import { ClientOnly } from "@/components/shell/client-only";
import { CaptureScreen } from "@/components/capture/capture-screen";

export const metadata: Metadata = { title: "Capture" };

export default function Page() {
  return (
    <ClientOnly>
      <CaptureScreen />
    </ClientOnly>
  );
}
