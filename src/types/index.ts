export type SyncStatus = 'pending' | 'synced' | 'failed';
export type TimerType = 'stopwatch' | 'countdown' | 'pomodoro' | 'deep-focus';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'skipped' | 'archived';

export interface BaseRecord {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  syncStatus: SyncStatus;
}

export interface Subject extends BaseRecord {
  name: string;
  icon?: string;
  emoji?: string;
  color: string;
  goalMinutes?: number;
  examDate?: string | null;
  priority: number;
  archived: boolean;
}

export interface Topic extends BaseRecord {
  subjectId: string;
  parentId?: string | null;
  name: string;
  kind: 'chapter' | 'topic';
}

export interface StudyTask extends BaseRecord {
  subjectId?: string | null;
  topicId?: string | null;
  title: string;
  description?: string;
  priority: number;
  deadline?: string | null;
  estimatedMinutes?: number;
  actualMinutes?: number;
  status: TaskStatus;
  repeat?: string | null;
  completedAt?: string | null;
}

export interface StudySession extends BaseRecord {
  subjectId?: string | null;
  topicId?: string | null;
  taskId?: string | null;
  startTime: string;
  endTime: string;
  studySeconds: number;
  breakSeconds: number;
  pauseSeconds: number;
  timerType: TimerType | 'manual';
  focusRating?: number;
  note?: string;
  deviceId: string;
}

export interface Goal extends BaseRecord {
  type: 'daily_time' | 'weekly_time' | 'monthly_time' | 'subject_time' | 'sessions' | 'pages' | 'questions';
  target: number;
  period: 'daily' | 'weekly' | 'monthly' | 'custom';
  subjectId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface Exam extends BaseRecord {
  subjectId?: string | null;
  name: string;
  date: string;
  priority: number;
  targetHours?: number;
  completedHours?: number;
  notes?: string;
}

export interface UserSettings {
  userId: string;
  language: 'en' | 'fa';
  calendarType: 'gregorian' | 'jalali';
  numberFormat: 'latin' | 'persian';
  weekStart: 'saturday' | 'sunday' | 'monday';
  themeId: string;
  defaultTimer: TimerType;
  pomodoroFocus: number;
  pomodoroShortBreak: number;
  pomodoroLongBreak: number;
  notifications: boolean;
  haptics: boolean;
  sounds: boolean;
  reduceMotion: boolean;
  updatedAt: string;
  syncStatus?: SyncStatus;
}

export interface ActiveTimer {
  id: string;
  userId: string;
  subjectId?: string | null;
  topicId?: string | null;
  taskId?: string | null;
  timerType: TimerType;
  startedAt: string;
  pausedAt?: string | null;
  totalPausedMs: number;
  durationSeconds?: number | null;
  state: 'running' | 'paused';
}
