import { ButtonLink } from "@/components/ui/button";
import { Page, PageTitle } from "@/components/ui/layout";

export default function NotFound() {
  return (
    <Page width="note" className="pt-16 lg:pt-28">
      <PageTitle>This page isn&apos;t here</PageTitle>
      <p className="mt-4 text-body text-ink-muted">The link may be out of date. Your journey has everything in one place.</p>
      <ButtonLink href="/journey" className="mt-8">
        Go to your journey
      </ButtonLink>
    </Page>
  );
}
