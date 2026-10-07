"use client";

import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type Ref } from "react";
import { ChevronDown, NotebookText } from "lucide-react";
import { Card, Section } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/states";
import { TodoRow } from "@/components/ui/todo-row";
import type { CareView } from "@/lib/care";
import { cn } from "@/lib/cn";
import type { Todo, Visit } from "@/lib/types";
import { sortLikeOpenTodos } from "./format";
import type { JourneyIds } from "./ids";

/** The to-do behind a change event that bubbled up from a TodoRow's checkbox, if any. */
function changedTodo(e: FormEvent<HTMLElement>): { id: string; checkbox: HTMLInputElement } | null {
  const target: EventTarget = e.target;
  if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return null;
  const id = target.closest<HTMLElement>("[data-todo-id]")?.dataset.todoId;
  return id ? { id, checkbox: target } : null;
}

/**
 * Her open to-dos, newest visit first, with the done ones a tap away.
 *
 * A to-do she checks off here stays in place, struck through, until she leaves Journey,
 * so a tap never makes a row jump out from under her finger. One she unchecks in the
 * Done list moves back up to Open, and keyboard focus moves with it.
 */
export function OpenTodos({ care, ids }: { care: CareView; ids: JourneyIds }) {
  const [justDone, setJustDone] = useState<ReadonlySet<string>>(() => new Set());
  const listRef = useRef<HTMLUListElement>(null);
  const refocus = useRef<{ id: string; scroll: boolean } | null>(null);

  // Journey is hidden (not unmounted) when she navigates away; settle the list then.
  useEffect(() => () => setJustDone(new Set()), []);

  // After a reopened to-do lands in the open list, put focus back on its checkbox.
  useLayoutEffect(() => {
    const pending = refocus.current;
    if (!pending) return;
    const row = listRef.current?.querySelector<HTMLElement>(`[data-todo-id="${CSS.escape(pending.id)}"]`);
    const checkbox = row?.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (!row || !checkbox) return;
    refocus.current = null;
    checkbox.focus({ preventScroll: true });
    if (pending.scroll) row.scrollIntoView({ block: "nearest" });
  });

  const kept = care.doneTodos.filter((t) => justDone.has(t.id));
  const open = kept.length ? sortLikeOpenTodos([...care.openTodos, ...kept], care.todos) : care.openTodos;
  const done = kept.length ? care.doneTodos.filter((t) => !justDone.has(t.id)) : care.doneTodos;

  const onOpenListChange = (e: FormEvent<HTMLUListElement>) => {
    const changed = changedTodo(e);
    if (!changed) return;
    const { id, checkbox } = changed;
    setJustDone((prev) => {
      const nextSet = new Set(prev);
      if (checkbox.checked) nextSet.add(id);
      else nextSet.delete(id);
      return nextSet;
    });
  };

  const onDoneListChange = (e: FormEvent<HTMLUListElement>) => {
    const changed = changedTodo(e);
    if (!changed || changed.checkbox.checked) return;
    // Scroll to its new place only when she's using the keyboard; a tap shouldn't move the page.
    refocus.current = { id: changed.id, scroll: changed.checkbox.matches(":focus-visible") };
  };

  return (
    <Section id={ids.todos} title="Open to-dos">
      {open.length ? (
        <Card className="px-5">
          <TodoRuns todos={open} care={care} listRef={listRef} onChange={onOpenListChange} />
        </Card>
      ) : (
        <EmptyState title="Nothing open right now">
          New to-dos from your visits will show up here.
        </EmptyState>
      )}
      {done.length ? <DoneTodos todos={done} care={care} onListChange={onDoneListChange} /> : null}
    </Section>
  );
}

/** Done to-dos, collapsed by default. Includes ones a later visit covered. */
function DoneTodos({
  todos,
  care,
  onListChange,
}: {
  todos: Todo[];
  care: CareView;
  onListChange: (e: FormEvent<HTMLUListElement>) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="-ml-3 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-body-sm font-medium text-ink-muted transition-colors duration-200 hover:bg-sunken hover:text-ink"
      >
        <span>Done</span>
        <span className="tabular text-ink-muted/80">{todos.length}</span>
        <ChevronDown
          size={16}
          aria-hidden
          className={cn("transition-transform duration-300 ease-calm", open && "rotate-180")}
        />
      </button>
      <div id={panelId} hidden={!open}>
        {open ? (
          <Card className="mt-2 animate-fade-in px-5">
            <TodoRuns todos={todos} care={care} onChange={onListChange} />
          </Card>
        ) : null}
      </div>
    </div>
  );
}

interface Run {
  key: string;
  source: Visit | undefined;
  todos: Todo[];
}

/** Consecutive to-dos from the same visit, so the visit is named once per run, not under every row. */
function toRuns(todos: Todo[], care: CareView): Run[] {
  const runs: Run[] = [];
  const seen = new Map<string, number>();
  for (const todo of todos) {
    const sourceId = todo.sourceVisitId ?? "none";
    const last = runs.at(-1);
    if (last && (last.source?.id ?? "none") === sourceId) {
      last.todos.push(todo);
      continue;
    }
    const n = seen.get(sourceId) ?? 0;
    seen.set(sourceId, n + 1);
    const source = todo.sourceVisitId ? care.visitById.get(todo.sourceVisitId) : undefined;
    runs.push({ key: `${sourceId}-${n}`, source, todos: [todo] });
  }
  return runs;
}

/** A hairline-divided list of to-dos, grouped under the visit each run came from. */
function TodoRuns({
  todos,
  care,
  listRef,
  onChange,
}: {
  todos: Todo[];
  care: CareView;
  listRef?: Ref<HTMLUListElement>;
  onChange: (e: FormEvent<HTMLUListElement>) => void;
}) {
  return (
    <ul ref={listRef} className="divide-y divide-line" onChange={onChange}>
      {toRuns(todos, care).map((run) => (
        <li key={run.key}>
          {run.source ? <RunSource visit={run.source} /> : null}
          <ul className="divide-y divide-line">
            {run.todos.map((todo) => (
              <li key={todo.id} data-todo-id={todo.id}>
                <TodoRow todo={todo} showSource={false} />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function RunSource({ visit }: { visit: Visit }) {
  return (
    <div className="-mb-1.5 pt-2">
      <Link
        href={`/visit/${visit.id}`}
        className="-ml-1 inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-caption font-medium text-ink-muted transition-colors duration-200 hover:text-ink"
      >
        <NotebookText size={15} aria-hidden className="shrink-0 text-sage" />
        <span>
          From <span className="underline decoration-line-strong/40 underline-offset-[3px]">{visit.notes.title}</span>
        </span>
      </Link>
    </div>
  );
}
