"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { Bars } from "@/components/ui/bars";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";
import type { TranscriptSegment } from "@/lib/types";

type Speaker = TranscriptSegment["speaker"];

/** How close to the bottom still counts as "following along". */
const STICK_PX = 48;

/**
 * The live transcript, in a sheet. Final lines sit in a polite log so a screen reader hears each
 * line once, when it's complete; the line still being heard follows it, visibly lighter.
 * Follows the newest line unless the patient has scrolled up to reread.
 */
export function LiveTranscriptSheet({
  open,
  onClose,
  segments,
  clinicianLabel,
  paused,
}: {
  open: boolean;
  onClose: () => void;
  segments: TranscriptSegment[];
  clinicianLabel: string;
  paused: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);
  const [following, setFollowing] = useState(true);

  // Lines in time order. Superseded interims are already gone (see mergeSegment); if more than
  // one utterance is still being heard, show the newest.
  const ordered = [...segments].sort((a, b) => a.startMs - b.startMs);
  const finals = ordered.filter((s) => s.isFinal);
  const interim = ordered.filter((s) => !s.isFinal).at(-1);
  const label: Record<Speaker, string> = { patient: "You", clinician: clinicianLabel, unknown: "Other" };

  const toBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  // New words: keep the newest line in view, unless she has scrolled up.
  useLayoutEffect(() => {
    if (followRef.current) toBottom();
  }, [segments]);

  // Opening the sheet always starts at the newest line.
  useEffect(() => {
    if (!open) return;
    followRef.current = true;
    const frame = requestAnimationFrame(toBottom);
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_PX;
    followRef.current = atBottom;
    setFollowing(atBottom);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Transcript so far"
      size="lg"
      eyebrow={
        <span className="inline-flex items-center gap-2">
          <Bars size="xs" live={!paused} className={cn(paused && "opacity-35")} />
          {paused ? "Paused" : "Recording"}
        </span>
      }
    >
      <div className="relative -mx-6 mt-2 border-t border-line lg:-mx-8">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          tabIndex={0}
          role="region"
          aria-label="Transcript"
          className="h-[min(58dvh,520px)] overflow-y-auto overscroll-contain px-6 pb-6 pt-5 focus-visible:outline-offset-[-2px] lg:px-8"
        >
          {segments.length === 0 ? (
            <p className="text-body text-ink-muted">What&rsquo;s said will appear here as you talk.</p>
          ) : null}
          <div role="log" aria-label="Transcript lines" className="flex flex-col">
            {finals.map((s, i) => (
              <Line
                key={s.id}
                segment={s}
                label={label[s.speaker]}
                continues={finals[i - 1]?.speaker === s.speaker}
                first={i === 0}
              />
            ))}
          </div>
          {interim ? (
            <Line
              segment={interim}
              label={label[interim.speaker]}
              continues={finals.at(-1)?.speaker === interim.speaker}
              first={finals.length === 0}
              interim
            />
          ) : null}
        </div>
        {!following ? (
          <button
            type="button"
            onClick={() => {
              followRef.current = true;
              setFollowing(true);
              toBottom();
            }}
            className="absolute bottom-4 left-1/2 inline-flex h-11 -translate-x-1/2 animate-fade-in items-center gap-1.5 rounded-full border border-line bg-surface pl-3.5 pr-4 text-body-sm font-medium text-ink shadow-soft transition-colors duration-200 hover:bg-paper"
          >
            <ArrowDown size={16} aria-hidden />
            Newest
          </button>
        ) : null}
      </div>
    </Sheet>
  );
}

const Line = memo(function Line({
  segment,
  label,
  continues,
  first,
  interim = false,
}: {
  segment: TranscriptSegment;
  label: string;
  continues: boolean;
  first: boolean;
  interim?: boolean;
}) {
  return (
    <div className={cn(first ? "mt-0" : continues ? "mt-2.5" : "mt-6")}>
      <p className={cn("text-body-sm font-medium text-ink", continues && "sr-only")}>{label}</p>
      <p
        className={cn(
          "mt-0.5 text-body text-pretty transition-colors duration-300 ease-calm",
          interim ? "text-ink-muted" : "text-ink",
        )}
      >
        {segment.text}
        {interim ? <span className="sr-only"> (in progress)</span> : null}
      </p>
    </div>
  );
});
