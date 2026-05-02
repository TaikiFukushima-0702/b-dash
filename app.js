// 論理脳トレーナー — アプリ本体
// 進捗・XP・連続日数・キャラクター進化・実績・Claude API連携

(function () {
  "use strict";

  const STORAGE_KEY = "logical-trainer-state-v1";
  const SETTINGS_KEY = "logical-trainer-settings-v1";

  const TYPE_INFO = {
    syllogism: { label: "三段論法",         emoji: "🔗", desc: "前提→結論を導く力" },
    knights:   { label: "嘘つき・正直者",   emoji: "🎭", desc: "矛盾を見抜く力" },
    sequence:  { label: "数列・パターン",   emoji: "🔢", desc: "規則性を見抜く力" },
    fermi:     { label: "フェルミ推定",     emoji: "📐", desc: "概算で答えを出す力" },
    critical:  { label: "クリティカル思考", emoji: "🧠", desc: "前提を疑う力" },
  };
  const TYPE_KEYS = Object.keys(TYPE_INFO);

  const DEFAULT_STATE = {
    xp: 0,
    streak: 0,
    lastActiveDate: null,
    todayCount: 0,
    todayDate: null,
    totalSolved: 0,
    correctSolved: 0,
    history: [],
    typeStats: {},
    program: {},
    seenIds: [],
    problemStatus: {},   // { id: 'correct' | 'wrong' }
    unlockedAchievements: [],
    bestLevel: 1,
  };

  const DEFAULT_SETTINGS = {
    apiKey: "",
    model: "claude-opus-4-7",
  };

  // ----- state 管理 -----
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch (e) {
      return { ...DEFAULT_STATE };
    }
  }
  function saveState(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
  let state = loadState();

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {
      return { ...DEFAULT_SETTINGS };
    }
  }
  function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
  let settings = loadSettings();

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function diffDays(a, b) {
    return Math.round((new Date(b) - new Date(a)) / 86400000);
  }
  function rolloverIfNeeded() {
    const t = todayStr();
    if (state.todayDate !== t) {
      state.todayDate = t;
      state.todayCount = 0;
      saveState(state);
    }
  }
  function recordActivity() {
    const t = todayStr();
    if (state.lastActiveDate === t) return;
    if (state.lastActiveDate) {
      const d = diffDays(state.lastActiveDate, t);
      state.streak = d === 1 ? state.streak + 1 : 1;
    } else {
      state.streak = 1;
    }
    state.lastActiveDate = t;
    saveState(state);
  }

  function levelFromXp(xp) { return Math.floor(xp / 100) + 1; }

  // ----- 実績アンロック判定 -----
  function checkAchievements() {
    const newly = [];
    for (const a of window.ACHIEVEMENTS) {
      const wasUnlocked = state.unlockedAchievements.includes(a.id);
      if (a.check(state)) {
        if (!wasUnlocked) {
          state.unlockedAchievements.push(a.id);
          newly.push(a);
        }
      }
    }
    if (newly.length) saveState(state);
    return newly;
  }

  function showAchievementToast(achievements) {
    achievements.forEach((a, i) => {
      const t = document.createElement("div");
      t.className = "toast";
      t.innerHTML = `<span class="toast-emoji">${a.emoji}</span><div><strong>実績解放: ${escape(a.label)}</strong><div class="muted small">${escape(a.desc)}</div></div>`;
      document.body.appendChild(t);
      setTimeout(() => t.classList.add("show"), 50 + i * 200);
      setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 400); }, 4000 + i * 200);
    });
  }

  // ----- レンダリング: ヘッダー -----
  function renderHeader() {
    document.getElementById("stat-level").textContent = levelFromXp(state.xp);
    document.getElementById("stat-xp").textContent = state.xp;
    document.getElementById("stat-streak").textContent = state.streak;
    document.getElementById("stat-solved").textContent = state.correctSolved;
  }

  // ----- ダッシュボード: キャラクター -----
  function renderCharacter() {
    const lv = levelFromXp(state.xp);
    const stage = window.getCharacterForLevel(lv);
    const card = document.getElementById("character-card");

    let nextInfo = "";
    if (stage.next) {
      const need = stage.maxLevel - lv + 1;
      nextInfo = `<div class="char-next muted small">次の進化: <strong>${escape(stage.next.name)}</strong> ${stage.next.emoji}(あとレベル${need})</div>`;
    } else {
      nextInfo = `<div class="char-next muted small">最終形態に到達! 学習を続けると経験豊富な賢者に磨きがかかります。</div>`;
    }

    const xpInLv = state.xp % 100;
    const justEvolved = state.bestLevel < lv;
    if (justEvolved) state.bestLevel = lv;

    card.style.borderColor = stage.color;
    card.innerHTML = `
      <div class="char-display" style="background: radial-gradient(circle at 30% 30%, ${stage.color}33, transparent 60%);">
        <div class="char-emoji ${justEvolved ? "evolved" : ""}">${stage.emoji}</div>
      </div>
      <div class="char-info">
        <div class="char-stage muted small">Stage ${stage.index + 1} / ${stage.total}</div>
        <h2 class="char-name">${escape(stage.name)}</h2>
        <div class="char-title">${escape(stage.title)} ・ Lv.${lv}</div>
        <p class="char-bio">${escape(stage.bio)}</p>
        <div class="xp-bar">
          <div class="xp-fill" style="width: ${xpInLv}%; background: ${stage.color};"></div>
          <span class="xp-label">${xpInLv} / 100 XP</span>
        </div>
        ${nextInfo}
      </div>
    `;
  }

  // ----- ダッシュボード: 全体 -----
  function renderDashboard() {
    rolloverIfNeeded();
    renderCharacter();

    const goal = 3;
    const count = Math.min(state.todayCount, goal);
    document.getElementById("today-count").textContent = `${count} / ${goal}`;
    document.getElementById("today-bar").style.width = `${(count / goal) * 100}%`;
    document.getElementById("streak-num").textContent = state.streak;
    document.getElementById("today-message").textContent =
      count >= goal
        ? "🎉 今日のノルマ達成! 余力があれば追加トレーニングへ。"
        : "毎日少しずつでOK。今日の3問にチャレンジしましょう。";

    const ul = document.getElementById("type-list");
    ul.innerHTML = "";
    TYPE_KEYS.forEach((k) => {
      const info = TYPE_INFO[k];
      const stats = state.typeStats[k] || { attempts: 0, correct: 0 };
      const acc = stats.attempts ? Math.round((stats.correct / stats.attempts) * 100) : 0;
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="emoji">${info.emoji}</span>
        <div class="type-info">
          <strong>${info.label}</strong>
          <span class="muted">${info.desc}</span>
        </div>
        <span class="acc">${stats.attempts ? acc + "%" : "—"}</span>
      `;
      li.addEventListener("click", () => {
        switchTab("train");
        document.getElementById("filter-type").value = k;
        startProblem();
      });
      ul.appendChild(li);
    });

    const skill = document.getElementById("skill-list");
    skill.innerHTML = "";
    const ranked = TYPE_KEYS.map((k) => {
      const s = state.typeStats[k] || { attempts: 0, correct: 0 };
      return { k, acc: s.attempts ? s.correct / s.attempts : null, attempts: s.attempts };
    });
    const tried = ranked.filter((r) => r.attempts > 0);
    if (tried.length === 0) {
      skill.innerHTML = `<li class="muted">まだデータがありません。トレーニングを始めましょう!</li>`;
    } else {
      tried.sort((a, b) => b.acc - a.acc);
      const best = tried[0];
      const worst = tried[tried.length - 1];
      skill.innerHTML += `<li>💪 強み: <strong>${TYPE_INFO[best.k].label}</strong>(正答率 ${Math.round(best.acc * 100)}%)</li>`;
      if (best.k !== worst.k) {
        skill.innerHTML += `<li>📈 伸びしろ: <strong>${TYPE_INFO[worst.k].label}</strong>(正答率 ${Math.round(worst.acc * 100)}%)</li>`;
      }
    }

    const fr = document.getElementById("featured-resource");
    if (window.RESOURCES && window.RESOURCES.length) {
      const r = window.RESOURCES[Math.floor(Math.random() * window.RESOURCES.length)];
      fr.innerHTML = `
        <div class="resource featured">
          <div class="rtag">${labelForResource(r.type)}</div>
          <strong>${escape(r.title)}</strong>
          <p class="muted">${escape(r.pitch)}</p>
        </div>
      `;
    }
  }

  function labelForResource(t) {
    if (t === "book") return "📚 書籍";
    if (t === "site") return "🌐 Web";
    if (t === "youtube") return "▶️ YouTube";
    return t;
  }

  // ----- トレーニング -----
  let currentProblem = null;

  function pickProblem() {
    const type = document.getElementById("filter-type").value;
    const level = document.getElementById("filter-level").value;
    let pool = window.PROBLEMS.slice();
    if (type !== "random") pool = pool.filter((p) => p.type === type);
    if (level !== "any") pool = pool.filter((p) => String(p.level) === level);
    if (pool.length === 0) return null;
    const recent = state.seenIds.slice(-10);
    const fresh = pool.filter((p) => !recent.includes(p.id));
    const candidates = fresh.length ? fresh : pool;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function startProblem(problemOverride) {
    const p = problemOverride || pickProblem();
    const area = document.getElementById("problem-area");
    if (!p) {
      area.innerHTML = `<p class="muted">条件に合う問題がありません。フィルターを変えてみてください。</p>
        <div class="train-actions"><button class="btn primary" id="start-train">問題を出す</button></div>`;
      bindStart();
      return;
    }
    currentProblem = p;
    const info = TYPE_INFO[p.type] || { label: p.type || "AI生成", emoji: "🤖" };
    const stars = "★".repeat(p.level) + "☆".repeat(3 - p.level);
    area.innerHTML = `
      <div class="problem">
        <div class="ptag">${info.emoji} ${escape(info.label)} <span class="muted">${stars}</span></div>
        <h3>${escape(p.title)}</h3>
        <pre class="pbody">${escape(p.body)}</pre>
        <div class="choices">
          ${p.choices.map((c, i) => `<button class="choice" data-i="${i}">${escape(c)}</button>`).join("")}
        </div>
      </div>
    `;
    area.querySelectorAll(".choice").forEach((btn) => {
      btn.addEventListener("click", () => answerChosen(parseInt(btn.dataset.i, 10)));
    });
  }

  function answerChosen(i) {
    if (!currentProblem) return;
    const correct = i === currentProblem.answer;

    state.totalSolved += 1;
    if (correct) {
      state.correctSolved += 1;
      state.xp += currentProblem.level * 10;
    } else {
      state.xp += 2;
    }
    const t = currentProblem.type || "ai";
    state.typeStats[t] = state.typeStats[t] || { attempts: 0, correct: 0 };
    state.typeStats[t].attempts += 1;
    if (correct) state.typeStats[t].correct += 1;

    // 問題ごとのステータス: 一度正解したら常に正解扱い
    const prev = state.problemStatus[currentProblem.id];
    if (correct) state.problemStatus[currentProblem.id] = "correct";
    else if (prev !== "correct") state.problemStatus[currentProblem.id] = "wrong";

    state.history.unshift({
      id: currentProblem.id,
      type: t,
      title: currentProblem.title,
      correct,
      level: currentProblem.level,
      at: new Date().toISOString(),
    });
    if (state.history.length > 100) state.history.length = 100;

    state.seenIds.push(currentProblem.id);
    if (state.seenIds.length > 50) state.seenIds = state.seenIds.slice(-50);

    rolloverIfNeeded();
    state.todayCount += 1;
    recordActivity();
    saveState(state);
    renderHeader();

    const newAch = checkAchievements();
    if (newAch.length) showAchievementToast(newAch);

    const area = document.getElementById("problem-area");
    const choiceBtns = area.querySelectorAll(".choice");
    choiceBtns.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === currentProblem.answer) btn.classList.add("correct");
      if (idx === i && !correct) btn.classList.add("wrong");
    });

    const aiAvailable = !!settings.apiKey;
    const fb = document.createElement("div");
    fb.className = "feedback " + (correct ? "ok" : "ng");
    fb.innerHTML = `
      <div class="fhead">${correct ? "🎉 正解!" : "😅 不正解"}</div>
      <p>${escape(currentProblem.explanation)}</p>
      <div class="actions">
        <button class="btn primary" id="next-q">次の問題へ</button>
        ${aiAvailable ? `<button class="btn ghost" id="ai-explain">🤖 AIに詳しく解説してもらう</button>` : ``}
        <button class="btn ghost" id="back-train">トレーニング画面に戻る</button>
      </div>
      <div id="ai-explain-out"></div>
    `;
    area.querySelector(".problem").appendChild(fb);
    document.getElementById("next-q").addEventListener("click", () => startProblem());
    document.getElementById("back-train").addEventListener("click", () => {
      area.innerHTML = `<div class="train-actions">
        <button class="btn primary" id="start-train">問題を出す</button>
        ${settings.apiKey ? `<button class="btn ghost" id="ai-generate">🤖 AIに新しい問題を作ってもらう</button>` : ``}
      </div>`;
      bindStart();
      bindAiGenerate();
    });
    if (aiAvailable) {
      document.getElementById("ai-explain").addEventListener("click", aiExplainCurrent);
    }
  }

  function bindStart() {
    const b = document.getElementById("start-train");
    if (b) b.addEventListener("click", () => startProblem());
  }
  function bindAiGenerate() {
    const b = document.getElementById("ai-generate");
    if (b) b.addEventListener("click", aiGenerateProblem);
  }

  // ----- 30日プログラム -----
  function renderProgram() {
    const grid = document.getElementById("program-grid");
    grid.innerHTML = "";
    window.PROGRAM.forEach((d) => {
      const done = !!state.program[d.day];
      const div = document.createElement("div");
      div.className = "day-card" + (done ? " done" : "");
      div.innerHTML = `
        <div class="day-num">Day ${d.day}</div>
        <div class="day-theme">${escape(d.theme)}</div>
        <div class="day-task"><strong>📥 INPUT</strong> ${escape(d.input)}</div>
        <div class="day-task"><strong>📝 OUTPUT</strong> ${escape(d.output)}</div>
        <label class="day-check">
          <input type="checkbox" data-day="${d.day}" ${done ? "checked" : ""} />
          完了
        </label>
      `;
      grid.appendChild(div);
    });
    grid.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", (e) => {
        const day = parseInt(e.target.dataset.day, 10);
        if (e.target.checked) {
          state.program[day] = true;
          state.xp += 20;
          recordActivity();
        } else {
          delete state.program[day];
        }
        saveState(state);
        renderHeader();
        const newAch = checkAchievements();
        if (newAch.length) showAchievementToast(newAch);
        e.target.closest(".day-card").classList.toggle("done", e.target.checked);
      });
    });
  }

  // ----- 実績バッジ + 問題ステータス -----
  function renderAchievements() {
    const grid = document.getElementById("achievements-grid");
    const groups = {};
    window.ACHIEVEMENTS.forEach((a) => {
      groups[a.group] = groups[a.group] || [];
      groups[a.group].push(a);
    });
    const total = window.ACHIEVEMENTS.length;
    const unlocked = state.unlockedAchievements.length;
    document.getElementById("ach-progress").textContent = `(${unlocked} / ${total} 解放)`;

    grid.innerHTML = "";
    Object.entries(groups).forEach(([group, list]) => {
      const section = document.createElement("div");
      section.className = "ach-group";
      section.innerHTML = `<h3>${escape(group)}</h3><div class="ach-row"></div>`;
      const row = section.querySelector(".ach-row");
      list.forEach((a) => {
        const isUnlocked = state.unlockedAchievements.includes(a.id);
        const card = document.createElement("div");
        card.className = "ach-badge" + (isUnlocked ? " unlocked" : " locked");
        card.innerHTML = `
          <div class="ach-emoji">${isUnlocked ? a.emoji : "🔒"}</div>
          <div class="ach-name">${escape(a.label)}</div>
          <div class="ach-desc muted small">${escape(a.desc)}</div>
        `;
        row.appendChild(card);
      });
      grid.appendChild(section);
    });

    // 問題ステータス
    const status = document.getElementById("problem-status");
    status.innerHTML = "";
    TYPE_KEYS.forEach((k) => {
      const info = TYPE_INFO[k];
      const probs = window.PROBLEMS.filter((p) => p.type === k);
      const correctCnt = probs.filter((p) => state.problemStatus[p.id] === "correct").length;
      const sec = document.createElement("div");
      sec.className = "ps-section";
      sec.innerHTML = `
        <h3>${info.emoji} ${escape(info.label)} <span class="muted small">(${correctCnt}/${probs.length} 正解済み)</span></h3>
        <div class="ps-grid"></div>
      `;
      const psGrid = sec.querySelector(".ps-grid");
      probs.forEach((p) => {
        const st = state.problemStatus[p.id]; // 'correct' | 'wrong' | undefined
        const mark = st === "correct" ? "○" : st === "wrong" ? "×" : "—";
        const cls = st === "correct" ? "ok" : st === "wrong" ? "ng" : "untried";
        const stars = "★".repeat(p.level);
        const item = document.createElement("button");
        item.className = `ps-item ${cls}`;
        item.title = "クリックでこの問題に挑戦";
        item.innerHTML = `
          <span class="ps-mark">${mark}</span>
          <span class="ps-title">${escape(p.title)}</span>
          <span class="ps-level muted small">${stars}</span>
        `;
        item.addEventListener("click", () => {
          switchTab("train");
          startProblem(p);
        });
        psGrid.appendChild(item);
      });
      status.appendChild(sec);
    });
  }

  // ----- 学習リソース -----
  function renderResources() {
    const sel = document.getElementById("filter-resource").value;
    const grid = document.getElementById("resource-grid");
    grid.innerHTML = "";
    const list = sel === "all" ? window.RESOURCES : window.RESOURCES.filter((r) => r.type === sel);
    list.forEach((r) => {
      const div = document.createElement("div");
      div.className = "resource";
      div.innerHTML = `
        <div class="rtag">${labelForResource(r.type)}</div>
        <strong>${escape(r.title)}</strong>
        <div class="rmeta">難易度: ${escape(r.level)} ・ 所要: ${escape(r.minutes)}</div>
        <p>${escape(r.pitch)}</p>
        <p class="muted"><small>💡 ${escape(r.why)}</small></p>
      `;
      grid.appendChild(div);
    });
  }

  // ----- 学習ログ -----
  function renderLog() {
    const stats = document.getElementById("log-stats");
    const acc = state.totalSolved ? Math.round((state.correctSolved / state.totalSolved) * 100) : 0;
    stats.innerHTML = `
      <div class="logstat"><span>累計解答</span><strong>${state.totalSolved}</strong></div>
      <div class="logstat"><span>累計正解</span><strong>${state.correctSolved}</strong></div>
      <div class="logstat"><span>正答率</span><strong>${acc}%</strong></div>
      <div class="logstat"><span>累計XP</span><strong>${state.xp}</strong></div>
      <div class="logstat"><span>レベル</span><strong>${levelFromXp(state.xp)}</strong></div>
      <div class="logstat"><span>30日進捗</span><strong>${Object.keys(state.program).length} / 30</strong></div>
      <div class="logstat"><span>実績</span><strong>${state.unlockedAchievements.length} / ${window.ACHIEVEMENTS.length}</strong></div>
    `;
    const ul = document.getElementById("history");
    ul.innerHTML = "";
    if (!state.history.length) {
      ul.innerHTML = `<li class="muted">まだ解答履歴はありません。</li>`;
    } else {
      state.history.slice(0, 20).forEach((h) => {
        const li = document.createElement("li");
        const info = TYPE_INFO[h.type] || { label: h.type || "AI", emoji: "🤖" };
        const d = new Date(h.at);
        const ds = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        li.innerHTML = `
          <span class="hres ${h.correct ? "ok" : "ng"}">${h.correct ? "○" : "×"}</span>
          <span class="htag">${info.emoji} ${escape(info.label)}</span>
          <span class="htitle">${escape(h.title || "")}</span>
          <span class="hdate muted">${ds}</span>
        `;
        ul.appendChild(li);
      });
    }
  }

  // ----- ナビ -----
  function switchTab(name) {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
    if (name === "dashboard")    renderDashboard();
    if (name === "program")      renderProgram();
    if (name === "achievements") renderAchievements();
    if (name === "resources")    renderResources();
    if (name === "log")          renderLog();
    if (name === "train") {
      document.getElementById("problem-area").innerHTML = `<div class="train-actions">
        <button class="btn primary" id="start-train">問題を出す</button>
        ${settings.apiKey ? `<button class="btn ghost" id="ai-generate">🤖 AIに新しい問題を作ってもらう</button>` : ``}
      </div>`;
      bindStart();
      bindAiGenerate();
    }
  }

  // ----- ユーティリティ -----
  function escape(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/\n/g, "<br>");
  }

  // =========================================
  // Claude API 連携
  // =========================================

  // Anthropic Messages API をブラウザから直接叩く。
  // anthropic-dangerous-direct-browser-access ヘッダで CORS を許可。
  async function callClaude({ system, userMessage, maxTokens }) {
    if (!settings.apiKey) throw new Error("APIキーが未設定です");
    const body = {
      model: settings.model || "claude-opus-4-7",
      max_tokens: maxTokens || 1024,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userMessage }],
    };
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": settings.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let detail = "";
      try { detail = JSON.stringify(await res.json()); } catch (e) { detail = await res.text(); }
      throw new Error(`API エラー(${res.status}): ${detail.slice(0, 300)}`);
    }
    const data = await res.json();
    const txt = (data.content || []).find((b) => b.type === "text")?.text || "";
    return txt;
  }

  async function aiExplainCurrent() {
    if (!currentProblem) return;
    const out = document.getElementById("ai-explain-out");
    const btn = document.getElementById("ai-explain");
    btn.disabled = true;
    out.innerHTML = `<div class="ai-card loading">🤖 Claude に問い合わせ中…</div>`;

    const system = "あなたは論理的思考を教える優しい家庭教師です。日本語で、初心者にもわかるように、論理的な仕組みを段階的に説明してください。長すぎず、要点を300〜500字程度でまとめてください。必要に応じて関連する論理学の用語(後件肯定の誤謬、対偶、MECE 等)を補足してください。";
    const userMsg = `次の問題があります。\n\n【問題】\n${currentProblem.body}\n\n【選択肢】\n${currentProblem.choices.map((c,i)=>`${i+1}. ${c}`).join("\n")}\n\n【正解】 選択肢${currentProblem.answer + 1}: ${currentProblem.choices[currentProblem.answer]}\n\n【既存の解説】\n${currentProblem.explanation}\n\nこの問題のポイントを、なぜ他の選択肢が間違いなのか/正解はなぜ正しいのかを含めて、もう少し丁寧に解説してください。`;

    try {
      const text = await callClaude({ system, userMessage: userMsg, maxTokens: 800 });
      out.innerHTML = `<div class="ai-card"><div class="ai-head">🤖 Claudeによる詳しい解説</div><div class="ai-body">${escape(text)}</div></div>`;
    } catch (e) {
      out.innerHTML = `<div class="ai-card error"><strong>エラー:</strong> ${escape(e.message)}</div>`;
    } finally {
      btn.disabled = false;
    }
  }

  async function aiGenerateProblem() {
    const btn = document.getElementById("ai-generate");
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = "🤖 生成中…";

    // 苦手なジャンルを優先して出題
    const ranked = TYPE_KEYS.map((k) => {
      const s = state.typeStats[k] || { attempts: 0, correct: 0 };
      return { k, acc: s.attempts ? s.correct / s.attempts : 1.0, attempts: s.attempts };
    }).sort((a, b) => a.acc - b.acc);
    const targetType = ranked[0]?.k || "syllogism";
    const info = TYPE_INFO[targetType];

    const system = `あなたは論理的思考のトレーナーです。日本語で、4択形式の論理問題を1問だけ厳密にJSONで出力してください。
JSONの形式:
{"title": "...", "body": "問題本文", "choices": ["選択肢1","選択肢2","選択肢3","選択肢4"], "answer": 0, "explanation": "解説", "level": 2}
- answer は 0〜3 の整数(正解選択肢のindex)
- level は 1(入門)〜3(応用)
- 余計な前置きや markdown コードブロックは絶対に付けない。JSONのみ返す。
- 日本語で。`;
    const userMsg = `ジャンル: ${info.label}(${info.desc})\n難易度: ★★(基礎〜応用)\nこのジャンルに合った新しい論理問題を1問作ってください。`;

    try {
      const text = await callClaude({ system, userMessage: userMsg, maxTokens: 800 });
      // markdown コードブロックが付いていても剥がす
      const jsonStr = text.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "").trim();
      const obj = JSON.parse(jsonStr);
      if (!obj.title || !Array.isArray(obj.choices) || obj.choices.length !== 4 || typeof obj.answer !== "number") {
        throw new Error("AIの返答が想定形式ではありませんでした");
      }
      const p = {
        id: "ai-" + Date.now(),
        type: targetType,
        level: obj.level || 2,
        title: obj.title,
        body: obj.body || obj.title,
        choices: obj.choices,
        answer: Math.max(0, Math.min(3, obj.answer)),
        explanation: obj.explanation || "(解説なし)",
      };
      startProblem(p);
    } catch (e) {
      alert("AI問題の生成に失敗しました: " + e.message);
      btn.disabled = false;
      btn.textContent = "🤖 AIに新しい問題を作ってもらう";
    }
  }

  // ----- 設定モーダル -----
  function openSettings() {
    document.getElementById("api-key").value = settings.apiKey || "";
    document.getElementById("api-model").value = settings.model || "claude-opus-4-7";
    document.getElementById("settings-status").textContent = "";
    document.getElementById("settings-modal").hidden = false;
  }
  function closeSettings() {
    document.getElementById("settings-modal").hidden = true;
  }
  function applySettingsUi() {
    // AI関連ボタンの表示切り替え
    const aiGen = document.getElementById("ai-generate");
    if (aiGen) aiGen.hidden = !settings.apiKey;
  }
  async function testConnection() {
    const status = document.getElementById("settings-status");
    status.textContent = "🔄 テスト中…";
    try {
      const text = await callClaude({
        system: "あなたは挨拶ボットです。短く一言で挨拶してください。",
        userMessage: "こんにちは",
        maxTokens: 50,
      });
      status.innerHTML = `✅ 接続OK: <em>${escape(text.slice(0, 80))}</em>`;
    } catch (e) {
      status.innerHTML = `❌ 失敗: ${escape(e.message)}`;
    }
  }

  // ----- イベント設定 -----
  function init() {
    rolloverIfNeeded();
    renderHeader();
    renderDashboard();
    checkAchievements(); // 既存データから取得済みのバッジを反映

    document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));
    document.querySelectorAll("[data-tab-link]").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tabLink)));

    document.getElementById("start-today").addEventListener("click", () => {
      switchTab("train");
      document.getElementById("filter-type").value = "random";
      document.getElementById("filter-level").value = "any";
      startProblem();
    });
    bindStart();
    bindAiGenerate();
    applySettingsUi();

    document.getElementById("filter-resource").addEventListener("change", renderResources);

    document.getElementById("export-data").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logical-trainer-${todayStr()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    document.getElementById("reset-data").addEventListener("click", () => {
      if (confirm("学習データをすべて削除します。本当によろしいですか?")) {
        localStorage.removeItem(STORAGE_KEY);
        state = loadState();
        renderHeader();
        renderDashboard();
        renderProgram();
        renderLog();
        alert("リセットしました。");
      }
    });

    // settings modal
    document.getElementById("open-settings").addEventListener("click", openSettings);
    document.querySelectorAll("[data-close-modal]").forEach((b) => b.addEventListener("click", closeSettings));
    document.getElementById("save-settings").addEventListener("click", () => {
      settings.apiKey = document.getElementById("api-key").value.trim();
      settings.model = document.getElementById("api-model").value;
      saveSettings(settings);
      document.getElementById("settings-status").textContent = "✅ 保存しました。";
      applySettingsUi();
      // 現在 train タブにいたら再描画して AI ボタン出す
      switchTab(document.querySelector(".tab.active").dataset.tab);
    });
    document.getElementById("test-settings").addEventListener("click", () => {
      // 入力中の値で一時的にテスト
      const tmp = { ...settings };
      settings.apiKey = document.getElementById("api-key").value.trim();
      settings.model = document.getElementById("api-model").value;
      testConnection().finally(() => { settings = tmp; });
    });
    document.getElementById("clear-settings").addEventListener("click", () => {
      if (confirm("APIキー設定を削除しますか?")) {
        settings = { ...DEFAULT_SETTINGS };
        saveSettings(settings);
        document.getElementById("api-key").value = "";
        document.getElementById("settings-status").textContent = "🗑 削除しました。";
        applySettingsUi();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
