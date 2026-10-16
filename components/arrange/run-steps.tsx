import { Check } from "lucide-react";
import { Bars } from "@/components/ui/bars";
import { Disclosure } from "@/components/ui/disclosure";
import { linkifyPhones } from "@/components/ui/prose";
import { cn } from "@/lib/cn";
import type { AgentEvent, CallLine } from "@/lib/types";

type Item =
  | { kind: "step"; id: string; text: string; result?: string; done: boolean }
  | { kind: "call"; key: string; office: string; phone: string; lines: CallLine[] };

/** The steps and calls in the order they happened. Options and outcomes are shown elsewhere. */
export function toItems(events: AgentEvent[]): Item[] {
  const items: Item[] = [];
  events.forEach((e, i) => {
    if (e.type === "step") items.push({ kind: "step", id: e.id, text: e.text, done: false });
    else if (e.type === "step-done") {
      const step = items.find((it): it is Extract<Item, { kind: "step" }> => it.kind === "step" && it.id === e.id);
      if (step) {
        step.done = true;
        step.result = e.result;
      }
    } else if (e.type === "call") items.push({ kind: "call", key: `call-${i}`, office: e.office, phone: e.phone, lines: e.lines });
  });
  return items;
}

/** One sentence per finished step, for the live region. */
export function finishedSentences(events: AgentEvent[]): string[] {
  return toItems(events).flatMap((it) =>
    it.kind === "step" && it.done ? [`${it.text.replace(/[.…]+$/, "")}. ${it.result ?? ""}`.trim()] : [],
  );
}

/** "Linden Health Imaging scheduling" speaks as "Linden Health Imaging". */
export function shortOffice(office: string): string {
  return office.replace(/\s+(scheduling|office|front desk|desk|team|department)$/i, "").trim() || office;
}

export function Marker({ state }: { state: "working" | "done" | "stopped" }) {
  return (
    <span aria-hidden className="mt-[5px] grid size-[18px] shrink-0 place-items-center">
      {state === "working" ? <Bars size="xs" live /> : null}
      {state === "done" ? (
        <span className="grid size-[18px] place-items-center rounded-full bg-sage text-surface">
          <Check size={11} strokeWidth={2.75} />
        </span>
      ) : null}
      {state === "stopped" ? <span className="size-2 rounded-full border-[1.5px] border-line-strong" /> : null}
    </span>
  );
}

/** A simulated call, set like the transcript: who spoke, then what they said. Never bubbles. */
export function CallLines({ office, lines }: { office: string; lines: CallLine[] }) {
  const name = shortOffice(office);
  return (
    <ol className="flex flex-col gap-4">
      {lines.map((line, i) => (
        <li key={i} className="grid gap-0.5 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-4">
          <span className="text-body-sm font-medium text-ink">{line.speaker === "sonoclear" ? "Sonoclear" : name}</span>
          <span className="text-body-sm text-ink text-pretty">{line.text}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * What Sonoclear did, step by step. Working steps show the live bars, finished ones a sage check.
 * `unfinished` says how to show a step that never reported back: as done (a settled plan or a
 * replay) or as stopped (a run that failed).
 */
export function StepList({
  events,
  unfinished = "done",
  className,
}: {
  events: AgentEvent[];
  unfinished?: "working" | "done" | "stopped";
  className?: string;
}) {
  const items = toItems(events);
  if (!items.length) return null;
  return (
    <ol className={cn("flex flex-col gap-4", className)}>
      {items.map((it) =>
        it.kind === "step" ? (
          <li key={it.id} className="flex animate-rise-in gap-3">
            <Marker state={it.done ? "done" : unfinished} />
            <div className="min-w-0 flex-1">
              <p className="text-body text-ink">{linkifyPhones(it.text)}</p>
              {it.result ? <p className="mt-0.5 text-body-sm text-ink-muted">{linkifyPhones(it.result)}</p> : null}
            </div>
          </li>
        ) : (
          <li key={it.key} className="animate-rise-in sm:pl-[30px]">
            <Disclosure
              summary="What was said on the call"
              meta={
                <>
                  <span className="block">{it.office}</span>
                  <span className="block whitespace-nowrap">{it.phone}</span>
                </>
              }
            >
              <CallLines office={it.office} lines={it.lines} />
            </Disclosure>
          </li>
        ),
      )}
    </ol>
  );
}
