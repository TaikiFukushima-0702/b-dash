// 達成バッジ(アチーブメント)
// state を受け取って unlocked かを返す関数を持つ

window.ACHIEVEMENTS = [
  // === スタート ===
  { id: "first-solve",   group: "スタート", emoji: "🎯", label: "最初の一歩",   desc: "初めて問題を解いた",
    check: (s) => s.totalSolved >= 1 },
  { id: "first-correct", group: "スタート", emoji: "✨", label: "初正解",        desc: "初めて正解した",
    check: (s) => s.correctSolved >= 1 },

  // === 解答数 ===
  { id: "solve-10",  group: "解答数", emoji: "📝",  label: "10問解答",  desc: "累計10問解答",
    check: (s) => s.totalSolved >= 10 },
  { id: "solve-50",  group: "解答数", emoji: "📚",  label: "50問解答",  desc: "累計50問解答",
    check: (s) => s.totalSolved >= 50 },
  { id: "solve-100", group: "解答数", emoji: "📖",  label: "100問解答", desc: "累計100問解答",
    check: (s) => s.totalSolved >= 100 },

  // === 連続日数 ===
  { id: "streak-3",  group: "継続",   emoji: "🔥",  label: "3日連続",   desc: "3日連続で学習した",
    check: (s) => s.streak >= 3 },
  { id: "streak-7",  group: "継続",   emoji: "🔥",  label: "1週間継続", desc: "7日連続で学習した",
    check: (s) => s.streak >= 7 },
  { id: "streak-14", group: "継続",   emoji: "🔥",  label: "2週間継続", desc: "14日連続で学習した",
    check: (s) => s.streak >= 14 },
  { id: "streak-30", group: "継続",   emoji: "🌟", label: "1ヶ月継続", desc: "30日連続で学習した",
    check: (s) => s.streak >= 30 },

  // === ジャンル別マスター ===
  { id: "syl-master",   group: "ジャンル達人", emoji: "🔗", label: "三段論法マスター",   desc: "三段論法を10問正解",
    check: (s) => (s.typeStats.syllogism?.correct || 0) >= 10 },
  { id: "kn-master",    group: "ジャンル達人", emoji: "🎭", label: "嘘つきパズル名人",   desc: "嘘つき・正直者を10問正解",
    check: (s) => (s.typeStats.knights?.correct || 0) >= 10 },
  { id: "seq-master",   group: "ジャンル達人", emoji: "🔢", label: "数列の達人",         desc: "数列を10問正解",
    check: (s) => (s.typeStats.sequence?.correct || 0) >= 10 },
  { id: "fermi-master", group: "ジャンル達人", emoji: "📐", label: "フェルミ博士",       desc: "フェルミ推定を10問正解",
    check: (s) => (s.typeStats.fermi?.correct || 0) >= 10 },
  { id: "crit-master",  group: "ジャンル達人", emoji: "🧠", label: "批判的思考家",       desc: "クリティカル思考を10問正解",
    check: (s) => (s.typeStats.critical?.correct || 0) >= 10 },
  { id: "all-types",    group: "ジャンル達人", emoji: "🏆", label: "全ジャンル制覇",     desc: "5ジャンル全てで1問以上正解",
    check: (s) => ["syllogism","knights","sequence","fermi","critical"].every((t) => (s.typeStats[t]?.correct || 0) >= 1) },

  // === レベル ===
  { id: "level-5",  group: "レベル", emoji: "⭐",  label: "レベル5達成",  desc: "レベル5に到達",
    check: (s) => Math.floor(s.xp / 100) + 1 >= 5 },
  { id: "level-10", group: "レベル", emoji: "🌟", label: "レベル10達成", desc: "レベル10に到達",
    check: (s) => Math.floor(s.xp / 100) + 1 >= 10 },
  { id: "level-20", group: "レベル", emoji: "💫", label: "レベル20達成", desc: "レベル20に到達",
    check: (s) => Math.floor(s.xp / 100) + 1 >= 20 },
  { id: "level-30", group: "レベル", emoji: "👑", label: "レベル30達成", desc: "レベル30に到達",
    check: (s) => Math.floor(s.xp / 100) + 1 >= 30 },

  // === 30日プログラム ===
  { id: "program-7",  group: "プログラム", emoji: "📅", label: "プログラム1週間",   desc: "30日プログラムを7日完了",
    check: (s) => Object.keys(s.program).length >= 7 },
  { id: "program-15", group: "プログラム", emoji: "📅", label: "プログラム折返し", desc: "30日プログラムを15日完了",
    check: (s) => Object.keys(s.program).length >= 15 },
  { id: "program-30", group: "プログラム", emoji: "🎓", label: "プログラム卒業",   desc: "30日プログラム全完了",
    check: (s) => Object.keys(s.program).length >= 30 },

  // === 正答率 ===
  { id: "accuracy-80", group: "正答率", emoji: "🎯", label: "正答率80%",
    desc: "20問以上解いて正答率80%以上",
    check: (s) => s.totalSolved >= 20 && s.correctSolved / s.totalSolved >= 0.8 },
];
