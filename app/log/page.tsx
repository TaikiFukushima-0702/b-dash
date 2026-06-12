import { PageHeader, Section } from "@/components/ui";
import StudyLogForm from "@/components/StudyLogForm";
import SetupNotice from "@/components/SetupNotice";
import RecentLogs from "@/components/RecentLogs";
import { isNotionConfigured } from "@/lib/notion";
import { listStudyLogs } from "@/lib/data";
import { todayJst } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const configured = isNotionConfigured();
  const logs = configured ? await listStudyLogs(10) : [];

  return (
    <main className="flex-1">
      <PageHeader title="学習を記録" subtitle="キタミ式など、今日やったことを記録" />
      <Section className="space-y-4">
        {!configured && <SetupNotice />}
        <StudyLogForm today={todayJst()} />
        <RecentLogs logs={logs} />
      </Section>
    </main>
  );
}
