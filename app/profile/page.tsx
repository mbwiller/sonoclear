import type { Metadata } from "next";
import { ClientOnly } from "@/components/shell/client-only";
import { ProfileScreen } from "@/components/profile/profile-screen";

export const metadata: Metadata = { title: "Profile" };

export default function Page() {
  return (
    <ClientOnly>
      <ProfileScreen />
    </ClientOnly>
  );
}
