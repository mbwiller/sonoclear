"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { ChoiceChip } from "@/components/ui/chip";
import { REPLAY_FACTOR, type ReplaySpeed } from "@/lib/store";

const OPTIONS: { value: ReplaySpeed; label: string }[] = [
  { value: "realtime", label: "Real time" },
  { value: "demo", label: "Demo" },
  { value: "fast", label: "Fast" },
];

/** How long an hour of recording takes at this speed, in words: "about 2½ minutes". */
function hourTakes(factor: number): string {
  const seconds = 3600 / factor;
  if (seconds < 60) return "under a minute";
  const halves = Math.round(seconds / 30);
  const whole = Math.floor(halves / 2);
  const amount = halves % 2 ? `${whole || ""}½` : String(whole);
  return `about ${amount} ${halves === 2 ? "minute" : "minutes"}`;
}

/** True for any recording: described by the speed, never by a particular visit's length. */
function describe(speed: ReplaySpeed): string {
  if (speed === "realtime") return "Plays back at the pace it was recorded.";
  return `An hour-long visit replays in ${hourTakes(REPLAY_FACTOR[speed])}.`;
}

/** Real time / Demo / Fast, as a radio group: arrow keys move the choice, Tab leaves it. */
export function SpeedChoice({ value, onChange }: { value: ReplaySpeed; onChange: (speed: ReplaySpeed) => void }) {
  const labelId = useId();
  const hintId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent, index: number) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + OPTIONS.length) % OPTIONS.length;
    onChange(OPTIONS[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div>
      <p id={labelId} className="text-body font-medium text-ink">
        Recording replay speed
      </p>
      <p className="mt-1 text-body-sm text-ink-muted text-pretty">How quickly a scripted visit plays back in Capture.</p>
      <div role="radiogroup" aria-labelledby={labelId} aria-describedby={hintId} className="mt-4 flex flex-wrap gap-2">
        {OPTIONS.map((o, i) => {
          const selected = o.value === value;
          return (
            <ChoiceChip
              key={o.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              selected={selected}
              onClick={() => onChange(o.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {o.label}
            </ChoiceChip>
          );
        })}
      </div>
      <p id={hintId} className="mt-3 text-body-sm text-ink-muted">
        {describe(value)}
      </p>
    </div>
  );
}
