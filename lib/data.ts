import "server-only";
import {
  NOTION_DB,
  isNotionConfigured,
  notion,
  prop,
  queryDb,
} from "./notion";
import {
  mapCategoryStat,
  mapCharacterState,
  mapReviewItem,
  mapScheduleEvent,
  mapStudyLog,
} from "./notion-mappers";
import type {
  CategoryStat,
  CharacterState,
  ReviewItem,
  ScheduleEvent,
  StudyLog,
} from "./types";
import { levelForXp } from "./xp";
import { stageForLevel, stageDef } from "./character";
import { syllabusOf } from "./fe-categories";
import { todayJst } from "./date";

// Next.js 16 のキャッシュAPI刷新に伴い、読み取りはページ単位（force-dynamic）で都度実行する。
// 単一ユーザー用途では Notion への呼び出し回数は十分小さい。

// ---------------- Character ----------------

export function defaultCharacter(): CharacterState {
  return {
    id: null,
    totalXp: 0,
    level: 1,
    stage: 1,
    stageName: stageDef(1).name,
    streak: 0,
    lastStudyDate: null,
  };
}

export async function getCharacterState(): Promise<CharacterState> {
  if (!isNotionConfigured()) return defaultCharacter();
  const rows = await queryDb(NOTION_DB.character, { page_size: 1 });
  if (rows.length === 0) return defaultCharacter();
  return mapCharacterState(rows[0]);
}

/** 書き込み経路用（getCharacterState と同じだが意図を明示）。 */
export const getCharacterStateFresh = getCharacterState;

/** キャラ行が無ければ作成し、ページ ID を返す。 */
export async function ensureCharacterRow(): Promise<string> {
  const rows = await queryDb(NOTION_DB.character, { page_size: 1 });
  if (rows.length > 0) return rows[0].id;
  const created = await notion().pages.create({
    parent: { database_id: NOTION_DB.character },
    properties: {
      Name: prop.title("MainCharacter"),
      TotalXP: prop.number(0),
      Level: prop.number(1),
      Stage: prop.number(1),
      StageName: prop.richText(stageDef(1).name),
      Streak: prop.number(0),
    },
  });
  return created.id;
}

export async function writeCharacterState(state: {
  totalXp: number;
  streak: number;
  lastStudyDate: string;
}): Promise<{ level: number; stage: number; stageName: string }> {
  const pageId = await ensureCharacterRow();
  const level = levelForXp(state.totalXp);
  const stage = stageForLevel(level);
  const stageName = stageDef(stage).name;
  await notion().pages.update({
    page_id: pageId,
    properties: {
      TotalXP: prop.number(state.totalXp),
      Level: prop.number(level),
      Stage: prop.number(stage),
      StageName: prop.richText(stageName),
      Streak: prop.number(state.streak),
      LastStudyDate: prop.date(state.lastStudyDate),
    },
  });
  return { level, stage, stageName };
}

// ---------------- Study Log ----------------

export async function listStudyLogs(limit = 30): Promise<StudyLog[]> {
  if (!isNotionConfigured()) return [];
  const rows = await queryDb(NOTION_DB.studyLog, {
    page_size: limit,
    sorts: [{ property: "Date", direction: "descending" }],
  });
  return rows.map(mapStudyLog);
}

export interface NewStudyLog {
  date: string;
  minutes: number;
  source: string;
  categories: string[];
  chapter: string;
  problemsAttempted: number;
  problemsCorrect: number;
  xp: number;
  reflection: string;
  mood: string;
}

export async function createStudyLog(log: NewStudyLog): Promise<void> {
  await notion().pages.create({
    parent: { database_id: NOTION_DB.studyLog },
    properties: {
      Name: prop.title(`${log.date} 学習`),
      Date: prop.date(log.date),
      Minutes: prop.number(log.minutes),
      Source: prop.select(log.source),
      Category: prop.multiSelect(log.categories),
      Chapter: prop.richText(log.chapter),
      ProblemsAttempted: prop.number(log.problemsAttempted),
      ProblemsCorrect: prop.number(log.problemsCorrect),
      XP: prop.number(log.xp),
      Reflection: prop.richText(log.reflection),
      Mood: prop.select(log.mood),
      CreatedBy: prop.select("app"),
    },
  });
}

// ---------------- Review Queue ----------------

export async function listDueReviews(): Promise<ReviewItem[]> {
  if (!isNotionConfigured() || !NOTION_DB.review) return [];
  const today = todayJst();
  const rows = await queryDb(NOTION_DB.review, {
    page_size: 100,
    filter: {
      and: [
        { property: "Status", select: { equals: "Active" } },
        { property: "DueDate", date: { on_or_before: today } },
      ],
    },
    sorts: [{ property: "DueDate", direction: "ascending" }],
  });
  return rows.map(mapReviewItem);
}

export async function listAllReviews(): Promise<ReviewItem[]> {
  if (!isNotionConfigured() || !NOTION_DB.review) return [];
  const rows = await queryDb(NOTION_DB.review, {
    page_size: 100,
    sorts: [{ property: "DueDate", direction: "ascending" }],
  });
  return rows.map(mapReviewItem);
}

export async function createReviewItem(item: {
  name: string;
  category: string;
  sourceRef: string;
  dueDate: string;
  easeFactor: number;
}): Promise<void> {
  await notion().pages.create({
    parent: { database_id: NOTION_DB.review },
    properties: {
      Name: prop.title(item.name),
      Category: prop.select(item.category),
      SourceRef: prop.url(item.sourceRef),
      EaseFactor: prop.number(item.easeFactor),
      IntervalDays: prop.number(0),
      Repetitions: prop.number(0),
      DueDate: prop.date(item.dueDate),
      Status: prop.select("Active"),
    },
  });
}

export async function updateReviewItem(
  id: string,
  fields: {
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    dueDate: string;
    lastResult: string;
    lastReviewed: string;
    status: string;
  },
): Promise<void> {
  await notion().pages.update({
    page_id: id,
    properties: {
      EaseFactor: prop.number(fields.easeFactor),
      IntervalDays: prop.number(fields.intervalDays),
      Repetitions: prop.number(fields.repetitions),
      DueDate: prop.date(fields.dueDate),
      LastResult: prop.select(fields.lastResult),
      LastReviewed: prop.date(fields.lastReviewed),
      Status: prop.select(fields.status),
    },
  });
}

// ---------------- Schedule ----------------

export async function listSchedule(): Promise<ScheduleEvent[]> {
  if (!isNotionConfigured() || !NOTION_DB.schedule) return [];
  const rows = await queryDb(NOTION_DB.schedule, {
    page_size: 100,
    sorts: [{ property: "Date", direction: "ascending" }],
  });
  return rows.map(mapScheduleEvent);
}

export async function createScheduleEvent(ev: {
  name: string;
  date: string;
  endDate: string | null;
  type: string;
  categories: string[];
}): Promise<void> {
  await notion().pages.create({
    parent: { database_id: NOTION_DB.schedule },
    properties: {
      Name: prop.title(ev.name),
      Date: prop.date(ev.date, ev.endDate),
      Type: prop.select(ev.type),
      Category: prop.multiSelect(ev.categories),
      Done: prop.checkbox(false),
    },
  });
}

export async function setScheduleDone(id: string, done: boolean): Promise<void> {
  await notion().pages.update({
    page_id: id,
    properties: { Done: prop.checkbox(done) },
  });
}

// ---------------- Category Stats ----------------

export async function listCategoryStats(): Promise<CategoryStat[]> {
  if (!isNotionConfigured() || !NOTION_DB.categoryStats) return [];
  const rows = await queryDb(NOTION_DB.categoryStats, { page_size: 100 });
  return rows.map(mapCategoryStat);
}

/** カテゴリ別の挑戦/正答数を加算（無ければ作成）。 */
export async function incrementCategoryStat(
  category: string,
  attempted: number,
  correct: number,
): Promise<void> {
  if (!NOTION_DB.categoryStats) return;
  const rows = await queryDb(NOTION_DB.categoryStats, {
    page_size: 1,
    filter: { property: "Name", title: { equals: category } },
  });
  if (rows.length > 0) {
    const existing = mapCategoryStat(rows[0]);
    await notion().pages.update({
      page_id: rows[0].id,
      properties: {
        TotalAttempted: prop.number(existing.totalAttempted + attempted),
        TotalCorrect: prop.number(existing.totalCorrect + correct),
      },
    });
  } else {
    await notion().pages.create({
      parent: { database_id: NOTION_DB.categoryStats },
      properties: {
        Name: prop.title(category),
        TotalAttempted: prop.number(attempted),
        TotalCorrect: prop.number(correct),
        Syllabus: prop.select(syllabusOf(category) ?? ""),
      },
    });
  }
}
