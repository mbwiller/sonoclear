import { cn } from "@/lib/cn";

/**
 * The faint line-contour texture (VISION §6). Journey's header and the Ask page only.
 * Decorative; fades out toward the bottom.
 */
export function Contours({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "contours pointer-events-none absolute inset-x-0 top-0 h-[420px] [mask-image:linear-gradient(to_bottom,black_30%,transparent)]",
        className,
      )}
    />
  );
}
