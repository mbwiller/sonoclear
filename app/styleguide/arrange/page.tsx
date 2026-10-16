import type { Metadata } from "next";
import { ClientOnly } from "@/components/shell/client-only";
import { ArrangeGallery } from "@/components/styleguide/arrange-gallery";

export const metadata: Metadata = { title: "Arrange" };

export default function Page() {
  return (
    <ClientOnly>
      <ArrangeGallery />
    </ClientOnly>
  );
}
