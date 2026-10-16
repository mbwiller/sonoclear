import type { Metadata } from "next";
import { ClientOnly } from "@/components/shell/client-only";
import { RecordGallery } from "@/components/styleguide/record-gallery";

export const metadata: Metadata = { title: "Record button" };

export default function Page() {
  return (
    <ClientOnly>
      <RecordGallery />
    </ClientOnly>
  );
}
