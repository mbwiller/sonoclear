"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * A sheet built on native <dialog>: focus is trapped, Esc closes, the page behind is inert.
 * Bottom sheet on mobile, centered panel on desktop. Portaled to <body> so it can be
 * opened from inline content (a term inside a paragraph) without invalid nesting.
 */
export function Sheet({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  size = "md",
  titleClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
  titleClassName?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // The latest `open` prop, read by the native close event. When the owner has already
  // set open to false, the close is theirs and must not be reported back as a new close:
  // that would undo a sheet the owner opened in the same moment (one sheet handing off to another).
  const wantsOpen = useRef(open);

  useEffect(() => {
    wantsOpen.current = open;
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    // Hidden routes (Activity) and unmounts run this cleanup. A modal dialog left open
    // in the top layer would keep the rest of the app inert, so close it; the dialog's
    // close event then resets the owner's state through onClose.
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      onClose={() => {
        // The close event arrives a moment after close(). If the dialog is open again by then
        // (React's development double-run of effects closes and reopens it), nothing closed.
        if (ref.current?.open) return;
        if (wantsOpen.current) onClose();
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div
        className="flex h-full w-full items-end justify-center lg:items-center lg:p-8"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className={cn(
            "sheet-panel flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-sheet bg-surface shadow-soft lg:rounded-sheet",
            size === "md" ? "lg:max-w-[520px]" : "lg:max-w-[680px]",
          )}
        >
          <div className="shrink-0 px-6 pb-2 pt-6 lg:px-8 lg:pt-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 pt-1">
                {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
                <h2 id={titleId} className={cn("font-display text-display-md text-ink text-balance", titleClassName)}>
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="-mr-2 -mt-1 grid size-11 shrink-0 place-items-center rounded-full text-ink-muted transition-colors duration-200 hover:bg-sunken hover:text-ink"
                aria-label="Close"
              >
                <X size={20} aria-hidden />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 lg:px-8 lg:pb-8">{children}</div>
          {footer ? <div className="shrink-0 border-t border-line px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-8">{footer}</div> : null}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
