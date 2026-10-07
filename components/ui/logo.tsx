import { cn } from "@/lib/cn";
import { Bars } from "./bars";

/** Logo lockup: the three-bar mark and the serif wordmark. */
export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-ink", className)}>
      <Bars size={size === "md" ? "sm" : "xs"} />
      <span className={cn("font-display leading-none tracking-[-0.01em]", size === "md" ? "text-[1.375rem]" : "text-lg")}>
        Sonoclear
      </span>
    </span>
  );
}
