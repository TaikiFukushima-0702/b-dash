import { PageHeader, Section } from "@/components/ui";
import ScheduleView from "@/components/ScheduleView";
import ScheduleForm from "@/components/ScheduleForm";
import SetupNotice from "@/components/SetupNotice";
import { isNotionConfigured } from "@/lib/notion";
import { listSchedule } from "@/lib/data";
import { todayJst } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const configured = isNotionConfigured();
  const events = configured ? await listSchedule() : [];

  return (
    <main className="flex-1">
      <PageHeader title="スケジュール" subtitle="学習計画・模試・試験日を管理" />
      <Section className="space-y-5">
        {!configured && <SetupNotice />}
        <ScheduleView events={events} />
        <div>
          <h2 className="mb-2 text-sm font-semibold">予定を追加</h2>
          <ScheduleForm today={todayJst()} />
        </div>
      </Section>
    </main>
  );
}
