// アプリ全体で使うドメイン型。Notion ページとアプリの境界。
import type { Grade } from "./srs";
import type { ScheduleType, StudySource } from "./fe-categories";

export interface StudyLog {
  id: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  source: StudySource;
  categories: string[];
  chapter: string;
  problemsAttempted: number;
  problemsCorrect: number;
  xp: number;
  reflection: string;
  mood: string;
  createdBy: "app" | "claude";
}

export interface ReviewItem {
  id: string;
  name: string;
  category: string;
  sourceRef: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueDate: string | null;
  lastResult: Grade | null;
  lastReviewed: string | null;
  status: "Active" | "Suspended" | "Mastered";
}

export interface ScheduleEvent {
  id: string;
  name: string;
  date: string | null;
  endDate: string | null;
  type: ScheduleType;
  categories: string[];
  done: boolean;
  calendarEventId: string;
}

export interface CharacterState {
  id: string | null; // Notion ページ ID（無ければ未作成）
  totalXp: number;
  level: number;
  stage: number;
  stageName: string;
  streak: number;
  lastStudyDate: string | null;
}

export interface CategoryStat {
  id: string;
  name: string;
  totalAttempted: number;
  totalCorrect: number;
  accuracy: number; // 0..1
  weak: boolean;
  syllabus: string;
}
