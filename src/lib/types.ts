export type Status = 'backlog' | 'progress' | 'done';
export type Priority = 'high' | 'medium' | 'low';

export interface Goal {
  id: number;
  title: string;
  area: string;
  status: Status;
  priority: Priority;
  due?: string;
  progress: number;
}
