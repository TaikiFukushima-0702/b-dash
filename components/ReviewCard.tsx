import { gradeReview } from "@/app/actions/review";
import { Card, Pill } from "./ui";
import type { ReviewItem } from "@/lib/types";

const GRADE_LABELS: { grade: string; label: string; cls: string }[] = [
  { grade: "Again", label: "もう一度", cls: "bg-[var(--danger)]/15 text-[var(--danger)]" },
  { grade: "Hard", label: "むずい", cls: "bg-[var(--accent)]/20 text-[var(--accent)]" },
  { grade: "Good", label: "ふつう", cls: "bg-[var(--primary)]/15 text-[var(--primary)]" },
  { grade: "Easy", label: "かんたん", cls: "bg-[var(--success)]/15 text-[var(--success)]" },
];

export default function ReviewCard({ item }: { item: ReviewItem }) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-snug">{item.name}</p>
        {item.category && <Pill>{item.category}</Pill>}
      </div>
      {item.sourceRef && (
        <a
          href={item.sourceRef}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-xs text-[var(--primary)] underline"
        >
          {item.sourceRef}
        </a>
      )}
      <form action={gradeReview} className="grid grid-cols-4 gap-2">
        <input type="hidden" name="id" value={item.id} />
        {GRADE_LABELS.map((g) => (
          <button
            key={g.grade}
            type="submit"
            name="grade"
            value={g.grade}
            className={`rounded-lg py-2 text-xs font-bold active:scale-95 ${g.cls}`}
          >
            {g.label}
          </button>
        ))}
      </form>
    </Card>
  );
}
