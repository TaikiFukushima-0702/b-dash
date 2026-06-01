import { NoticeCard } from "./ui";

export default function SetupNotice() {
  return (
    <NoticeCard>
      <p className="font-semibold text-[var(--foreground)]">⚙️ Notion がまだ接続されていません</p>
      <ol className="mt-2 list-decimal space-y-1 pl-4">
        <li>Notion で Integration を作成しトークンを取得</li>
        <li>6つのデータベースを作成し Integration に共有（接続）</li>
        <li>
          環境変数 <code className="rounded bg-[var(--border)] px-1">NOTION_TOKEN</code> と各
          <code className="rounded bg-[var(--border)] px-1">NOTION_DB_*</code> を設定
        </li>
      </ol>
      <p className="mt-2">設定すると学習記録・XP・キャラの成長が保存されます。詳しくは README を参照してください。</p>
    </NoticeCard>
  );
}
