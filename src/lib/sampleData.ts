import { BattleRecord } from "./types";

export const sampleData: BattleRecord[] = [
  // Taro - Charizard ex メイン
  { date: "2026-03-01", player: "Taro", deck: "リザードンex", opponentDeck: "ルギアVSTAR", result: "win", event: "練習会" },
  { date: "2026-03-01", player: "Taro", deck: "リザードンex", opponentDeck: "パオジアンex", result: "win", event: "練習会" },
  { date: "2026-03-02", player: "Taro", deck: "リザードンex", opponentDeck: "ミライドンex", result: "loss", event: "練習会" },
  { date: "2026-03-08", player: "Taro", deck: "リザードンex", opponentDeck: "ルギアVSTAR", result: "win", event: "ジムバトル" },
  { date: "2026-03-08", player: "Taro", deck: "リザードンex", opponentDeck: "サーナイトex", result: "win", event: "ジムバトル" },
  { date: "2026-03-08", player: "Taro", deck: "リザードンex", opponentDeck: "パオジアンex", result: "loss", event: "ジムバトル" },
  { date: "2026-03-15", player: "Taro", deck: "ドラパルトex", opponentDeck: "リザードンex", result: "win", event: "練習会" },
  { date: "2026-03-15", player: "Taro", deck: "ドラパルトex", opponentDeck: "ルギアVSTAR", result: "loss", event: "練習会" },
  { date: "2026-03-22", player: "Taro", deck: "リザードンex", opponentDeck: "ミライドンex", result: "win", event: "シティリーグ" },
  { date: "2026-03-22", player: "Taro", deck: "リザードンex", opponentDeck: "サーナイトex", result: "win", event: "シティリーグ" },

  // Hana - パオジアンex メイン
  { date: "2026-03-01", player: "Hana", deck: "パオジアンex", opponentDeck: "リザードンex", result: "win", event: "練習会" },
  { date: "2026-03-01", player: "Hana", deck: "パオジアンex", opponentDeck: "ルギアVSTAR", result: "loss", event: "練習会" },
  { date: "2026-03-02", player: "Hana", deck: "パオジアンex", opponentDeck: "サーナイトex", result: "win", event: "練習会" },
  { date: "2026-03-08", player: "Hana", deck: "パオジアンex", opponentDeck: "ミライドンex", result: "loss", event: "ジムバトル" },
  { date: "2026-03-08", player: "Hana", deck: "パオジアンex", opponentDeck: "リザードンex", result: "win", event: "ジムバトル" },
  { date: "2026-03-15", player: "Hana", deck: "パオジアンex", opponentDeck: "ドラパルトex", result: "win", event: "練習会" },
  { date: "2026-03-15", player: "Hana", deck: "パオジアンex", opponentDeck: "ルギアVSTAR", result: "win", event: "練習会" },
  { date: "2026-03-22", player: "Hana", deck: "パオジアンex", opponentDeck: "リザードンex", result: "loss", event: "シティリーグ" },

  // Yuki - ルギアVSTAR メイン
  { date: "2026-03-01", player: "Yuki", deck: "ルギアVSTAR", opponentDeck: "パオジアンex", result: "win", event: "練習会" },
  { date: "2026-03-02", player: "Yuki", deck: "ルギアVSTAR", opponentDeck: "リザードンex", result: "loss", event: "練習会" },
  { date: "2026-03-08", player: "Yuki", deck: "ルギアVSTAR", opponentDeck: "サーナイトex", result: "win", event: "ジムバトル" },
  { date: "2026-03-08", player: "Yuki", deck: "ルギアVSTAR", opponentDeck: "ミライドンex", result: "win", event: "ジムバトル" },
  { date: "2026-03-15", player: "Yuki", deck: "ルギアVSTAR", opponentDeck: "リザードンex", result: "loss", event: "練習会" },
  { date: "2026-03-15", player: "Yuki", deck: "サーナイトex", opponentDeck: "パオジアンex", result: "win", event: "練習会" },
  { date: "2026-03-22", player: "Yuki", deck: "ルギアVSTAR", opponentDeck: "ドラパルトex", result: "win", event: "シティリーグ" },

  // Ken - ミライドンex メイン
  { date: "2026-03-01", player: "Ken", deck: "ミライドンex", opponentDeck: "ルギアVSTAR", result: "loss", event: "練習会" },
  { date: "2026-03-02", player: "Ken", deck: "ミライドンex", opponentDeck: "リザードンex", result: "win", event: "練習会" },
  { date: "2026-03-08", player: "Ken", deck: "ミライドンex", opponentDeck: "パオジアンex", result: "win", event: "ジムバトル" },
  { date: "2026-03-08", player: "Ken", deck: "ミライドンex", opponentDeck: "サーナイトex", result: "loss", event: "ジムバトル" },
  { date: "2026-03-15", player: "Ken", deck: "ミライドンex", opponentDeck: "リザードンex", result: "win", event: "練習会" },
  { date: "2026-03-22", player: "Ken", deck: "ミライドンex", opponentDeck: "ルギアVSTAR", result: "win", event: "シティリーグ" },
  { date: "2026-03-22", player: "Ken", deck: "ミライドンex", opponentDeck: "パオジアンex", result: "loss", event: "シティリーグ" },

  // Mika - サーナイトex メイン
  { date: "2026-03-01", player: "Mika", deck: "サーナイトex", opponentDeck: "リザードンex", result: "loss", event: "練習会" },
  { date: "2026-03-02", player: "Mika", deck: "サーナイトex", opponentDeck: "ルギアVSTAR", result: "win", event: "練習会" },
  { date: "2026-03-08", player: "Mika", deck: "サーナイトex", opponentDeck: "パオジアンex", result: "loss", event: "ジムバトル" },
  { date: "2026-03-08", player: "Mika", deck: "サーナイトex", opponentDeck: "ミライドンex", result: "win", event: "ジムバトル" },
  { date: "2026-03-15", player: "Mika", deck: "サーナイトex", opponentDeck: "ドラパルトex", result: "loss", event: "練習会" },
  { date: "2026-03-22", player: "Mika", deck: "サーナイトex", opponentDeck: "リザードンex", result: "win", event: "シティリーグ" },
  { date: "2026-03-22", player: "Mika", deck: "サーナイトex", opponentDeck: "ルギアVSTAR", result: "win", event: "シティリーグ" },
];
