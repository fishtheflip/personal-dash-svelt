export type Status = 'backlog' | 'progress' | 'done';
export type Priority = 'high' | 'medium' | 'low';
export type EntityId = string | number;

export interface Goal {
  id: EntityId;
  title: string;
  area: string;
  status: Status;
  priority: Priority;
  due?: string;
  progress: number;
}

export interface CalendarNote {
  id: EntityId;
  date: string;
  title: string;
  text: string;
  sortOrder: number;
}

export interface UsefulLink {
  id: EntityId;
  title: string;
  url: string;
  category: string;
  note: string;
}

export interface DailyCheckIn {
  id: EntityId;
  date: string;
  mood: number;
  energy: number;
  highlight: string;
  blockers: string;
  notes: string;
}

export interface Routine {
  id: EntityId;
  title: string;
}

export interface RoutineCompletion {
  routineId: EntityId;
  date: string;
}

export interface IdeaType {
  id: EntityId;
  name: string;
}

export interface Idea {
  id: EntityId;
  title: string;
  description: string;
  typeId: EntityId;
}

export interface IdeaGoalLink {
  ideaId: EntityId;
  goalId: EntityId;
}
