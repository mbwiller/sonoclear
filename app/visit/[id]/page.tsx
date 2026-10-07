import type { Metadata } from "next";
import { ClientOnly } from "@/components/shell/client-only";
import { VisitScreen } from "@/components/visit/visit-screen";

export const metadata: Metadata = { title: "Visit" };

export default function Page({ params }: PageProps<"/visit/[id]">) {
  return (
    <ClientOnly>
      <VisitScreen params={params} />
    </ClientOnly>
  );
}
