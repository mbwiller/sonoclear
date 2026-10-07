import { formatClock } from "@/lib/dates";
import type { Transcript, TranscriptSegment } from "@/lib/types";

type Speaker = TranscriptSegment["speaker"];

interface Turn {
  id: string;
  speaker: Speaker;
  startMs: number;
  lines: string[];
}

/** Consecutive lines from the same speaker read as one turn. */
function toTurns(segments: TranscriptSegment[]): Turn[] {
  const turns: Turn[] = [];
  for (const s of segments) {
    const last = turns.at(-1);
    if (last && last.speaker === s.speaker) last.lines.push(s.text);
    else turns.push({ id: s.id, speaker: s.speaker, startMs: s.startMs, lines: [s.text] });
  }
  return turns;
}

/**
 * The full transcript, read like a script: who spoke, when, and what they said.
 * "You" for Claire, the clinician's short name, and "Other" for anyone else in the room.
 */
export function TranscriptText({ transcript, clinicianLabel }: { transcript: Transcript; clinicianLabel: string }) {
  const label: Record<Speaker, string> = { patient: "You", clinician: clinicianLabel, unknown: "Other" };
  return (
    <ol className="flex flex-col gap-6">
      {toTurns(transcript.segments).map((turn) => (
        <li key={turn.id} className="grid gap-1.5 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-6">
          <p className="flex items-baseline gap-2.5 sm:flex-col sm:gap-0.5">
            <span className="text-body-sm font-medium text-ink">{label[turn.speaker]}</span>
            <span className="text-caption text-ink-muted tabular">
              <span className="sr-only">at </span>
              {formatClock(turn.startMs)}
            </span>
          </p>
          <div className="flex flex-col gap-3 text-body text-ink text-pretty">
            {turn.lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}
