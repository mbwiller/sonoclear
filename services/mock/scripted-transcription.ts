import type { Transcript, TranscriptSegment, VisitType } from "@/lib/types";
import type { TranscriptionProvider, TranscriptionSession } from "../types";

export interface ScriptedTranscriptionOptions {
  /** The fixture to replay for a visit type. */
  fixtureFor(visitType: VisitType): Transcript;
  /** How many fixture milliseconds pass per real millisecond (1 = real time). Read at start. */
  getSpeed(): number;
}

/** Real time between interim updates while a segment is being "heard". */
const INTERIM_TICK_MS = 140;

/**
 * Replays a timed fixture through the same interface a real streaming engine will use.
 * Each segment arrives word by word as interim results (isFinal: false), then once as final.
 */
export class ScriptedTranscriptionProvider implements TranscriptionProvider {
  constructor(private readonly opts: ScriptedTranscriptionOptions) {}

  start({ visitType }: { visitType: VisitType }): TranscriptionSession {
    return new ScriptedSession(this.opts.fixtureFor(visitType), Math.max(1, this.opts.getSpeed()));
  }
}

class ScriptedSession implements TranscriptionSession {
  private listeners: Array<(s: TranscriptSegment) => void> = [];
  private index = 0;
  private wordsShown = 0;
  /** Fixture time already replayed, in fixture ms. */
  private fixtureClock = 0;
  private lastTick = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private paused = false;
  private stopped = false;

  constructor(
    private readonly fixture: Transcript,
    private readonly speed: number,
  ) {
    this.lastTick = performance.now();
    this.schedule();
  }

  onSegment(cb: (s: TranscriptSegment) => void): void {
    this.listeners.push(cb);
  }

  pause(): void {
    if (this.paused || this.stopped) return;
    this.advanceClock();
    this.paused = true;
    this.clear();
  }

  resume(): void {
    if (!this.paused || this.stopped) return;
    this.paused = false;
    this.lastTick = performance.now();
    this.schedule();
  }

  /**
   * Ends the session. The mock fast-forwards to the end of the fixture so the
   * demo always produces a complete visit, whenever the patient taps End.
   */
  async stop(): Promise<Transcript> {
    this.stopped = true;
    this.clear();
    return {
      segments: this.fixture.segments.map((s) => ({ ...s, isFinal: true })),
      durationMs: this.fixture.durationMs,
    };
  }

  private advanceClock() {
    const now = performance.now();
    this.fixtureClock += (now - this.lastTick) * this.speed;
    this.lastTick = now;
  }

  private clear() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private emit(s: TranscriptSegment) {
    for (const cb of this.listeners) cb(s);
  }

  private schedule() {
    if (this.paused || this.stopped) return;
    const seg = this.fixture.segments[this.index];
    if (!seg) return; // Replay finished; the session stays open until the patient ends it.

    this.advanceClock();
    const words = seg.text.split(/\s+/);
    const span = Math.max(1, seg.endMs - seg.startMs);

    if (this.fixtureClock < seg.startMs) {
      this.timer = setTimeout(() => this.schedule(), Math.min(1000, (seg.startMs - this.fixtureClock) / this.speed));
      return;
    }

    if (this.fixtureClock >= seg.endMs) {
      this.emit({ ...seg, isFinal: true });
      this.index += 1;
      this.wordsShown = 0;
      this.timer = setTimeout(() => this.schedule(), 0);
      return;
    }

    const progress = (this.fixtureClock - seg.startMs) / span;
    const shown = Math.max(1, Math.ceil(progress * words.length));
    if (shown !== this.wordsShown) {
      this.wordsShown = shown;
      this.emit({ ...seg, text: words.slice(0, shown).join(" "), isFinal: false });
    }
    this.timer = setTimeout(() => this.schedule(), INTERIM_TICK_MS);
  }
}
