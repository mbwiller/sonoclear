import type { Metadata } from "next";
import { ClientOnly } from "@/components/shell/client-only";
import { AskScreen } from "@/components/ask/ask-screen";

export const metadata: Metadata = { title: "Ask" };

export default function Page() {
  return (
    <ClientOnly>
      <AskScreen />
    </ClientOnly>
  );
}
