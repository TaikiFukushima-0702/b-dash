import { PageHeader, Section } from "@/components/ui";
import KakomonForm from "@/components/KakomonForm";
import SetupNotice from "@/components/SetupNotice";
import { isNotionConfigured } from "@/lib/notion";
import { todayJst } from "@/lib/date";

export const dynamic = "force-dynamic";

export default function KakomonPage() {
  return (
    <main className="flex-1">
      <PageHeader title="過去問道場" subtitle="解いた結果を記録して弱点を把握" />
      <Section className="space-y-4">
        {!isNotionConfigured() && <SetupNotice />}
        <KakomonForm today={todayJst()} />
      </Section>
    </main>
  );
}
