import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full border border-line-strong/55 bg-surface text-body text-ink placeholder:text-ink-muted/80 " +
  "transition-[border-color] duration-200 hover:border-line-strong focus-visible:border-sage focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sage/40";

/** Labeled single-line input, pill-shaped. */
export function TextField({
  label,
  hint,
  id,
  className,
  ...rest
}: { label: string; hint?: string; id: string } & ComponentProps<"input">) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-body-sm font-medium text-ink">
        {label}
        {hint ? <span className="font-normal text-ink-muted"> {hint}</span> : null}
      </label>
      <input id={id} className={cn(control, "h-12 rounded-full px-5")} {...rest} />
    </div>
  );
}

/** Labeled multi-line input. */
export function TextArea({
  label,
  hint,
  id,
  className,
  ...rest
}: { label: string; hint?: string; id: string } & ComponentProps<"textarea">) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-body-sm font-medium text-ink">
        {label}
        {hint ? <span className="font-normal text-ink-muted"> {hint}</span> : null}
      </label>
      <textarea id={id} className={cn(control, "min-h-40 resize-y rounded-[20px] px-5 py-4 leading-relaxed")} {...rest} />
    </div>
  );
}
