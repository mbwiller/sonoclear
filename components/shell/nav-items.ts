export const NAV_ITEMS = [
  { href: "/journey", label: "Journey" },
  { href: "/capture", label: "Capture" },
  { href: "/records", label: "Records" },
  { href: "/ask", label: "Ask" },
  { href: "/arrange", label: "Arrange" },
] as const;

export type NavHref = (typeof NAV_ITEMS)[number]["href"];

/** Which tab owns a path. Visit pages live under Journey, record pages under Records. */
export function activeTab(pathname: string | null): NavHref | null {
  if (!pathname) return null;
  if (pathname.startsWith("/journey") || pathname.startsWith("/visit") || pathname.startsWith("/profile")) return "/journey";
  if (pathname.startsWith("/capture")) return "/capture";
  if (pathname.startsWith("/records") || pathname.startsWith("/record/")) return "/records";
  if (pathname.startsWith("/ask")) return "/ask";
  if (pathname.startsWith("/arrange")) return "/arrange";
  return null;
}
