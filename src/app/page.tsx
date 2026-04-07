"use client";

import { useState } from "react";
import { useBattleData } from "@/hooks/useBattleData";
import { TabNav } from "@/components/ui/TabNav";
import { Overview } from "@/components/dashboard/Overview";
import { PlayerCards } from "@/components/dashboard/PlayerCards";
import { DeckAnalysis } from "@/components/dashboard/DeckAnalysis";
import { MatchupTable } from "@/components/dashboard/MatchupTable";
import { TrendChart } from "@/components/dashboard/TrendChart";

const TABS = [
  { id: "overview", label: "概要" },
  { id: "players", label: "個人成績" },
  { id: "decks", label: "デッキ別" },
  { id: "matchups", label: "相性分析" },
  { id: "trends", label: "成績推移" },
];

export default function Home() {
  const { records, isLoading, error } = useBattleData();
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium">データの読み込みに失敗しました</p>
          <p className="text-red-600 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <p className="text-blue-800 font-medium">データがありません</p>
          <p className="text-blue-600 text-sm mt-2">
            Google Spreadsheet にデータを追加するか、環境変数 NEXT_PUBLIC_SHEET_CSV_URL を設定してください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mt-6">
        {activeTab === "overview" && <Overview records={records} />}
        {activeTab === "players" && <PlayerCards records={records} />}
        {activeTab === "decks" && <DeckAnalysis records={records} />}
        {activeTab === "matchups" && <MatchupTable records={records} />}
        {activeTab === "trends" && <TrendChart records={records} />}
      </div>
    </div>
  );
}
