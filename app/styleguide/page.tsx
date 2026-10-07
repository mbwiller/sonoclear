import type { Metadata } from "next";
import { ClientOnly } from "@/components/shell/client-only";
import { Styleguide } from "@/components/styleguide/styleguide";

export const metadata: Metadata = { title: "Styleguide" };

export default function Page() {
  return (
    <ClientOnly>
      <Styleguide />
    </ClientOnly>
  );
}
