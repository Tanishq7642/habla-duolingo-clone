// Mirrors backend/app/schemas. Kept hand-written and small; at a larger scale
// these would be generated from FastAPI's OpenAPI document.

export interface Level { level: number; xp_into_level: number; xp_for_next_level: number }
export interface Streak { current: number; longest: number; extended_today: boolean; at_risk: boolean }
export interface DailyGoal { goal_xp: number; xp_today: number; reached: boolean }
export interface CourseRef { id: number; title: string; language: string; flag: string }

export interface Learner {
  id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  timezone: string;
  hearts: number;
  max_hearts: number;
  gems: number;
  heart_refill_cost: number;
  total_xp: number;
  level: Level;
  streak: Streak;
  daily_goal: DailyGoal;
  momentum: { active_days: number; window_days: number };
  course: CourseRef | null;
  joined_at: string;
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  icon: string;
  threshold: number;
  progress: number;
  unlocked_at: string | null;
}

export interface Stats {
  learner: Learner;
  lessons_completed: number;
  perfect_lessons: number;
  practice_sessions: number;
  skills_completed: number;
  skills_total: number;
  achievements: Achievement[];
}

export interface Activity {
  days: { date: string; xp: number; goal_xp: number; lessons: number }[];
  recent: { attempt_id: number; kind: SessionKind; title: string; xp: number; mistakes: number; completed_at: string | null }[];
}

// ---------------------------------------------------------------- path
export type SkillStatus = "locked" | "available" | "in_progress" | "completed";
export type LessonStatus = "locked" | "available" | "completed";

export interface LessonNode { id: number; position: number; title: string; status: LessonStatus }
export interface SkillNode {
  id: number;
  title: string;
  description: string;
  icon: string;
  status: SkillStatus;
  lessons_completed: number;
  lessons_total: number;
  mastery: number;
  mastery_cap: number;
  xp: number;
  next_lesson_id: number | null;
  lessons: LessonNode[];
}
export interface UnitNode { id: number; position: number; title: string; description: string; theme: UnitTheme; skills: SkillNode[] }
export type UnitTheme = "leaf" | "sky" | "sun";
export interface LearningPath { course: CourseRef; units: UnitNode[] }

// ---------------------------------------------------------------- exercises
export interface Choice { id: string; text: string; emoji?: string | null }
export interface Tile { id: string; text: string }

export interface ExerciseDataMap {
  multiple_choice: { options: Choice[] };
  fill_blank: { before: string; after: string; translation: string | null; options: Choice[] };
  word_bank: { source_text: string; tiles: Tile[] };
  match_pairs: { left: Tile[]; right: Tile[] };
  type_answer: { source_text: string | null; placeholder: string; answer_language: string };
}

export interface AnswerMap {
  multiple_choice: { option_id: string };
  fill_blank: { option_id: string };
  word_bank: { tile_ids: string[] };
  match_pairs: { pairs: Record<string, string> };
  type_answer: { text: string };
}

export type ExerciseType = keyof ExerciseDataMap;

export interface Exercise<T extends ExerciseType = ExerciseType> {
  id: number;
  type: T;
  prompt: string;
  data: ExerciseDataMap[T];
  xp: number;
}

// ---------------------------------------------------------------- sessions
export type SessionKind = "lesson" | "practice";
export interface Progress { completed: number; total: number }

export interface Session {
  attempt_id: number;
  kind: SessionKind;
  status: "in_progress" | "completed" | "failed" | "abandoned";
  lesson_id: number | null;
  title: string;
  subtitle: string;
  exercises: Exercise[];
  next_exercise_id: number | null;
  progress: Progress;
  mistakes: number;
  hearts: number;
  resumed: boolean;
}

export interface AnswerResult {
  correct: boolean;
  correct_answer: string;
  note: string | null;
  explanation: string;
  detail: { wrong_left_ids?: string[] } | null;
  xp_earned: number;
  hearts_remaining: number;
  out_of_hearts: boolean;
  requeued: boolean;
  progress: Progress;
  next_exercise_id: number | null;
}

export interface Completion {
  attempt_id: number;
  kind: SessionKind;
  already_completed: boolean;
  xp: { base: number; bonus: number; total: number };
  gems_awarded: number;
  hearts_awarded: number;
  hearts: number;
  mistakes: number;
  perfect: boolean;
  streak: { current: number; longest: number; extended: boolean };
  daily_goal: { goal_xp: number; xp_today: number; reached: boolean; just_reached: boolean };
  level: Level & { leveled_up: boolean };
  skill: {
    id: number; title: string; icon: string; lessons_completed: number; lessons_total: number;
    mastery: number; mastery_cap: number; completed: boolean; just_completed: boolean;
  } | null;
  unlocked_skill: { id: number; title: string; icon: string } | null;
  achievements: Achievement[];
}

export interface Review {
  attempt_id: number;
  items: { exercise_id: number; type: ExerciseType; prompt: string; your_answer: string; correct_answer: string; explanation: string; times_missed: number }[];
}

export interface PracticeSummary { weak_exercises: number; available: boolean; reason: string | null }

export interface LeaderboardEntry {
  rank: number; user_id: number; username: string; display_name: string; avatar_color: string; xp: number; is_me: boolean;
}
export interface Leaderboard { period: "week" | "all"; window_label: string; entries: LeaderboardEntry[]; me: LeaderboardEntry | null }
