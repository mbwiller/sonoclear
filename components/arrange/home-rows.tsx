"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { linkifyPhones } from "@/components/ui/prose";
import { Sheet } from "@/components/ui/sheet";
import type { AgentEvent, ArrangeTask } from "@/lib/types";
import { StepList } from "./run-steps";

/** Something Sonoclear can arrange: what and why, who it would call, and the way to start. */
export function TaskRow({
  task,
  waitingReason,
  onArrange,
}: {
  task: Pick<ArrangeTask, "title" | "detail" | "office">;
  /** When another task must come first, why; shown instead of the button. */
  waitingReason?: string;
  onArrange: () => void;
}) {
  return (
    <li className="grid gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="text-body font-medium text-ink text-pretty">{task.title}</p>
        <p className="mt-0.5 text-body-sm text-ink-muted text-pretty">{task.detail}</p>
        <p className="mt-2 text-caption text-ink-muted text-pretty">
          {task.office.label}
          <span aria-hidden> · </span>
          <span className="sr-only">, </span>
          {linkifyPhones(task.office.phone)}
        </p>
      </div>
      {waitingReason ? (
        <p className="text-body-sm text-ink-muted text-pretty sm:max-w-[13rem] sm:text-right">{waitingReason}</p>
      ) : (
        <div>
          <Button variant="secondary" onClick={onArrange}>
            Arrange this<span className="sr-only">: {task.title}</span>
          </Button>
        </div>
      )}
    </li>
  );
}

/** Something already arranged: what, when and where, the reference, and a way to see how it went. */
export function ArrangedRow({
  title,
  when,
  reference,
  log,
}: {
  title: string;
  when: string;
  reference?: string;
  log: AgentEvent[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <li className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-body font-medium text-ink text-pretty">{title}</p>
        <p className="text-body-sm text-ink-muted text-pretty">{when}</p>
        {reference ? (
          <p className="mt-1 text-caption text-ink-muted">
            Reference <span className="tabular">{reference}</span>
          </p>
        ) : null}
      </div>
      <div className="-ml-5 sm:ml-0 sm:shrink-0">
        <Button variant="quiet" onClick={() => setOpen(true)} aria-haspopup="dialog">
          See what happened<span className="sr-only">: {title}</span>
        </Button>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} eyebrow="Arranged" title={title}>
        {log.some((e) => e.type === "step" || e.type === "call") ? (
          <StepList events={log} />
        ) : (
          <p className="text-body text-ink-muted">There&rsquo;s nothing more to show for this one.</p>
        )}
      </Sheet>
    </li>
  );
}

/** A visit that's already on the calendar. Read-only. */
export function BookedRow({ title, when }: { title: string; when: string }) {
  return (
    <li className="flex min-h-14 items-start gap-3 px-4 py-3">
      <span className="mt-0.5 shrink-0 text-sage">
        <CalendarDays size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-sm font-medium text-ink text-pretty">{title}</span>
        <span className="block text-caption text-ink-muted text-pretty">{when}</span>
      </span>
    </li>
  );
}
