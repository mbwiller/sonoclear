import type { Metadata } from "next";
import { ClientOnly } from "@/components/shell/client-only";
import { RecordScreen } from "@/components/records/record-screen";

export const metadata: Metadata = { title: "Record" };

export default function Page({ params }: PageProps<"/record/[id]">) {
  return (
    <ClientOnly>
      <RecordScreen params={params} />
    </ClientOnly>
  );
}
