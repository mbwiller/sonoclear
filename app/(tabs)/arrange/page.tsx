import type { Metadata } from "next";
import { ClientOnly } from "@/components/shell/client-only";
import { ArrangeScreen } from "@/components/arrange/arrange-screen";

export const metadata: Metadata = { title: "Arrange" };

export default function Page() {
  return (
    <ClientOnly>
      <ArrangeScreen />
    </ClientOnly>
  );
}
