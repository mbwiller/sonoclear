import { ButtonLink } from "@/components/ui/button";
import { BackLink, Page, PageTitle } from "@/components/ui/layout";

/** A calm dead end that isn't one: the link leads straight back to Journey. */
export function VisitNotFound() {
  return (
    <Page width="note">
      <BackLink href="/journey">Journey</BackLink>
      <div className="mt-14 lg:mt-20">
        <PageTitle>This visit isn&rsquo;t here</PageTitle>
        <p className="mt-4 max-w-md text-body text-ink-muted text-pretty">
          It may have been cleared when the preview was reset. All of your visits are on your journey.
        </p>
        <ButtonLink href="/journey" className="mt-8">
          Go to your journey
        </ButtonLink>
      </div>
    </Page>
  );
}
