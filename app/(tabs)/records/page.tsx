import type { Metadata } from "next";
import { ClientOnly } from "@/components/shell/client-only";
import { RecordsScreen } from "@/components/records/records-screen";

export const metadata: Metadata = { title: "Records" };

export default function Page() {
  return (
    <ClientOnly>
      <RecordsScreen />
    </ClientOnly>
  );
}
