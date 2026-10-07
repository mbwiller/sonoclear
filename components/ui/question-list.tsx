import { cn } from "@/lib/cn";

/** Questions the patient could bring to her care team: a calm, numbered list. */
export function QuestionList({ questions, className }: { questions: string[]; className?: string }) {
  return (
    <ol className={cn("border-t border-line", className)}>
      {questions.map((q, i) => (
        <li key={q} className="flex items-baseline gap-4 border-b border-line py-4">
          <span aria-hidden className="w-4 shrink-0 font-display text-[1.1875rem] leading-none text-ink-muted tabular">
            {i + 1}
          </span>
          <span className="text-body text-ink text-pretty">{q}</span>
        </li>
      ))}
    </ol>
  );
}
