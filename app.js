// 論理脳トレーナー — アプリ本体
// 進捗・XP・連続日数・出題ロジックなど

(function () {
  "use strict";

  const STORAGE_KEY = "logical-trainer-state-v1";
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
    lastActiveDate: null, // YYYY-MM-DD
    todayCount: 0,
    todayDate: null,
    totalSolved: 0,
    correctSolved: 0,
    history: [],          // { id, type, correct, at }
    typeStats: {},        // { type: { attempts, correct } }
    program: {},          // { dayNumber: true }
    seenIds: [],          // 重複出題回避
  };

  // ----- state 管理 -----
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const obj = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...obj };
    } catch (e) {
      return { ...DEFAULT_STATE };
    }
  }
  function saveState(s) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }
  let state = loadState();

  function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function diffDays(a, b) {
    const ad = new Date(a), bd = new Date(b);
    return Math.round((bd - ad) / (1000 * 60 * 60 * 24));
  }

  // 1日の境目で today カウンタをリセットし、連続日数を更新
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
    if (state.lastActiveDate === t) return; // 同日なら何もしない
    if (state.lastActiveDate) {
      const d = diffDays(state.lastActiveDate, t);
      if (d === 1) state.streak += 1;
      else state.streak = 1;
    } else {
      state.streak = 1;
    }
    state.lastActiveDate = t;
    saveState(state);
  }

  function levelFromXp(xp) {
    // 100 XPで1レベル
    return Math.floor(xp / 100) + 1;
  }

  // ----- レンダリング: ヘッダー -----
  function renderHeader() {
    document.getElementById("stat-level").textContent = levelFromXp(state.xp);
    document.getElementById("stat-xp").textContent = state.xp;
    document.getElementById("stat-streak").textContent = state.streak;
    document.getElementById("stat-solved").textContent = state.correctSolved;
  }

  // ----- ダッシュボード -----
  function renderDashboard() {
    rolloverIfNeeded();
    const goal = 3;
    const count = Math.min(state.todayCount, goal);
    document.getElementById("today-count").textContent = `${count} / ${goal}`;
    document.getElementById("today-bar").style.width = `${(count / goal) * 100}%`;
    document.getElementById("streak-num").textContent = state.streak;
    document.getElementById("today-message").textContent =
      count >= goal
        ? "🎉 今日のノルマ達成! 余力があれば追加トレーニングへ。"
        : "毎日少しずつでOK。今日の3問にチャレンジしましょう。";

    // 5種のトレーニング
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

    // 強み・弱み
    const skill = document.getElementById("skill-list");
    skill.innerHTML = "";
    const ranked = TYPE_KEYS.map((k) => {
      const s = state.typeStats[k] || { attempts: 0, correct: 0 };
      const acc = s.attempts ? s.correct / s.attempts : null;
      return { k, acc, attempts: s.attempts };
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

    // featured resource
    const fr = document.getElementById("featured-resource");
    if (window.RESOURCES && window.RESOURCES.length) {
      const r = window.RESOURCES[Math.floor(Math.random() * window.RESOURCES.length)];
      fr.innerHTML = `
        <div class="resource featured">
          <div class="rtag">${labelForResource(r.type)}</div>
          <strong>${r.title}</strong>
          <p class="muted">${r.pitch}</p>
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

    // 直近10件と被らないように
    const recent = state.seenIds.slice(-10);
    const fresh = pool.filter((p) => !recent.includes(p.id));
    const candidates = fresh.length ? fresh : pool;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function startProblem() {
    const p = pickProblem();
    const area = document.getElementById("problem-area");
    if (!p) {
      area.innerHTML = `<p class="muted">条件に合う問題がありません。フィルターを変えてみてください。</p>
        <button class="btn primary" id="start-train">問題を出す</button>`;
      bindStart();
      return;
    }
    currentProblem = p;
    const info = TYPE_INFO[p.type];
    const stars = "★".repeat(p.level) + "☆".repeat(3 - p.level);
    area.innerHTML = `
      <div class="problem">
        <div class="ptag">${info.emoji} ${info.label} <span class="muted">${stars}</span></div>
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

    // 状態を更新
    state.totalSolved += 1;
    if (correct) {
      state.correctSolved += 1;
      state.xp += currentProblem.level * 10;
    } else {
      state.xp += 2; // 不正解でも参加賞
    }
    const t = currentProblem.type;
    state.typeStats[t] = state.typeStats[t] || { attempts: 0, correct: 0 };
    state.typeStats[t].attempts += 1;
    if (correct) state.typeStats[t].correct += 1;

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

    // 結果UI
    const area = document.getElementById("problem-area");
    const choiceBtns = area.querySelectorAll(".choice");
    choiceBtns.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === currentProblem.answer) btn.classList.add("correct");
      if (idx === i && !correct) btn.classList.add("wrong");
    });
    const fb = document.createElement("div");
    fb.className = "feedback " + (correct ? "ok" : "ng");
    fb.innerHTML = `
      <div class="fhead">${correct ? "🎉 正解!" : "😅 不正解"}</div>
      <p>${escape(currentProblem.explanation)}</p>
      <div class="actions">
        <button class="btn primary" id="next-q">次の問題へ</button>
        <button class="btn ghost" id="back-train">トレーニング画面に戻る</button>
      </div>
    `;
    area.querySelector(".problem").appendChild(fb);
    document.getElementById("next-q").addEventListener("click", startProblem);
    document.getElementById("back-train").addEventListener("click", () => {
      area.innerHTML = `<button class="btn primary" id="start-train">問題を出す</button>`;
      bindStart();
    });
  }

  function bindStart() {
    const b = document.getElementById("start-train");
    if (b) b.addEventListener("click", startProblem);
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
          state.xp += 20; // プログラム完了でボーナスXP
          recordActivity();
        } else {
          delete state.program[day];
        }
        saveState(state);
        renderHeader();
        e.target.closest(".day-card").classList.toggle("done", e.target.checked);
      });
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
    `;
    const ul = document.getElementById("history");
    ul.innerHTML = "";
    if (!state.history.length) {
      ul.innerHTML = `<li class="muted">まだ解答履歴はありません。</li>`;
    } else {
      state.history.slice(0, 20).forEach((h) => {
        const li = document.createElement("li");
        const info = TYPE_INFO[h.type] || { label: h.type, emoji: "❓" };
        const d = new Date(h.at);
        const ds = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        li.innerHTML = `
          <span class="hres ${h.correct ? "ok" : "ng"}">${h.correct ? "○" : "×"}</span>
          <span class="htag">${info.emoji} ${info.label}</span>
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
    if (name === "dashboard") renderDashboard();
    if (name === "program")   renderProgram();
    if (name === "resources") renderResources();
    if (name === "log")       renderLog();
    if (name === "train") {
      document.getElementById("problem-area").innerHTML =
        `<button class="btn primary" id="start-train">問題を出す</button>`;
      bindStart();
    }
  }

  // ----- ユーティリティ -----
  function escape(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/\n/g, "<br>");
  }

  // ----- イベント設定 -----
  function init() {
    rolloverIfNeeded();
    renderHeader();
    renderDashboard();

    document.querySelectorAll(".tab").forEach((t) => {
      t.addEventListener("click", () => switchTab(t.dataset.tab));
    });
    document.querySelectorAll("[data-tab-link]").forEach((b) => {
      b.addEventListener("click", () => switchTab(b.dataset.tabLink));
    });

    document.getElementById("start-today").addEventListener("click", () => {
      switchTab("train");
      document.getElementById("filter-type").value = "random";
      document.getElementById("filter-level").value = "any";
      startProblem();
    });
    bindStart();

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
  }

  document.addEventListener("DOMContentLoaded", init);
})();
