import { PageHeader, Section, Card } from "@/components/ui";
import ReviewCard from "@/components/ReviewCard";
import AddReviewForm from "@/components/AddReviewForm";
import SetupNotice from "@/components/SetupNotice";
import { isNotionConfigured } from "@/lib/notion";
import { listAllReviews, listDueReviews } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const configured = isNotionConfigured();
  const [due, all] = await Promise.all([
    configured ? listDueReviews() : Promise.resolve([]),
    configured ? listAllReviews() : Promise.resolve([]),
  ]);
  const mastered = all.filter((r) => r.status === "Mastered").length;
  const scheduled = all.filter((r) => r.status === "Active").length - due.length;

  return (
    <main className="flex-1">
      <PageHeader title="復習" subtitle="間隔反復で記憶を定着させよう" />
      <Section className="space-y-5">
        {!configured && <SetupNotice />}

        <div>
          <h2 className="mb-2 text-sm font-semibold">今日やる復習（{due.length}）</h2>
          {due.length === 0 ? (
            <Card>
              <p className="text-sm text-[var(--muted)]">
                今日の復習はありません。お疲れさま！次の復習まで {Math.max(0, scheduled)} 件が待機中。
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {due.map((item) => (
                <ReviewCard key={item.id} item={item} />
              ))}
            </div>
          )}
          {mastered > 0 && (
            <p className="mt-2 text-center text-[11px] text-[var(--success)]">習得済み {mastered} 件 🎉</p>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold">復習を追加</h2>
          <AddReviewForm />
        </div>
      </Section>
    </main>
  );
}
