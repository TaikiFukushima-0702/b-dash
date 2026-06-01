import "server-only";
import {
  pProps,
  readCheckbox,
  readDateEnd,
  readDateStart,
  readFormulaBoolean,
  readFormulaNumber,
  readMultiSelect,
  readNumber,
  readRichText,
  readSelect,
  readTitle,
  readUrl,
} from "./notion";
import type {
  CategoryStat,
  CharacterState,
  ReviewItem,
  ScheduleEvent,
  StudyLog,
} from "./types";
import type { Grade } from "./srs";
import { syllabusOf } from "./fe-categories";

// Notion ページ → ドメインオブジェクトへの変換。プロパティ名は Notion 側の列名と一致させる。

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapStudyLog(page: any): StudyLog {
  const p = pProps(page);
  return {
    id: page.id,
    date: readDateStart(p["Date"]) ?? "",
    minutes: readNumber(p["Minutes"]),
    source: (readSelect(p["Source"]) || "その他") as StudyLog["source"],
    categories: readMultiSelect(p["Category"]),
    chapter: readRichText(p["Chapter"]),
    problemsAttempted: readNumber(p["ProblemsAttempted"]),
    problemsCorrect: readNumber(p["ProblemsCorrect"]),
    xp: readNumber(p["XP"]),
    reflection: readRichText(p["Reflection"]),
    mood: readSelect(p["Mood"]),
    createdBy: (readSelect(p["CreatedBy"]) || "app") as "app" | "claude",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapReviewItem(page: any): ReviewItem {
  const p = pProps(page);
  const status = (readSelect(p["Status"]) || "Active") as ReviewItem["status"];
  return {
    id: page.id,
    name: readTitle(p["Name"]),
    category: readSelect(p["Category"]),
    sourceRef: readUrl(p["SourceRef"]),
    easeFactor: readNumber(p["EaseFactor"]) || 2.5,
    intervalDays: readNumber(p["IntervalDays"]),
    repetitions: readNumber(p["Repetitions"]),
    dueDate: readDateStart(p["DueDate"]),
    lastResult: (readSelect(p["LastResult"]) || null) as Grade | null,
    lastReviewed: readDateStart(p["LastReviewed"]),
    status,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapScheduleEvent(page: any): ScheduleEvent {
  const p = pProps(page);
  return {
    id: page.id,
    name: readTitle(p["Name"]),
    date: readDateStart(p["Date"]),
    endDate: readDateEnd(p["Date"]),
    type: (readSelect(p["Type"]) || "学習計画") as ScheduleEvent["type"],
    categories: readMultiSelect(p["Category"]),
    done: readCheckbox(p["Done"]),
    calendarEventId: readRichText(p["CalendarEventId"]),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCharacterState(page: any): CharacterState {
  const p = pProps(page);
  return {
    id: page.id,
    totalXp: readNumber(p["TotalXP"]),
    level: readNumber(p["Level"]) || 1,
    stage: readNumber(p["Stage"]) || 1,
    stageName: readRichText(p["StageName"]),
    streak: readNumber(p["Streak"]),
    lastStudyDate: readDateStart(p["LastStudyDate"]),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCategoryStat(page: any): CategoryStat {
  const p = pProps(page);
  const name = readTitle(p["Name"]);
  const attempted = readNumber(p["TotalAttempted"]);
  const correct = readNumber(p["TotalCorrect"]);
  // Accuracy/WeakFlag は Notion formula 列。無ければアプリ側で算出。
  const accFromFormula = readFormulaNumber(p["Accuracy"]);
  const accuracy = accFromFormula || (attempted > 0 ? correct / attempted : 0);
  const weak = p["WeakFlag"]?.formula ? readFormulaBoolean(p["WeakFlag"]) : attempted >= 5 && accuracy < 0.6;
  return {
    id: page.id,
    name,
    totalAttempted: attempted,
    totalCorrect: correct,
    accuracy,
    weak,
    syllabus: readSelect(p["Syllabus"]) || syllabusOf(name) || "",
  };
}
