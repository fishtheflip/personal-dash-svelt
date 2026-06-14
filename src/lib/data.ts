import type {
  CalendarNote, DailyCheckIn, Goal, Idea, IdeaGoalLink, IdeaType, Priority, Routine, RoutineCompletion, Status, UsefulLink
} from '$lib/types';
import { supabase } from '$lib/supabase';

function client() {
  if (!supabase) throw new Error('Supabase не настроен. Добавьте переменные окружения.');
  return supabase;
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function getGoals(): Promise<Goal[]> {
  const { data, error } = await client().from('goals').select('*').order('created_at');
  fail(error);
  return (data ?? []).map((row) => ({ ...row, progress: 0 })) as Goal[];
}

export async function createGoal(input: Pick<Goal, 'title' | 'area' | 'status' | 'priority'>): Promise<Goal> {
  const { data, error } = await client().from('goals').insert(input).select().single();
  fail(error);
  return { ...data, progress: 0 } as Goal;
}

export async function createGoals(inputs: Pick<Goal, 'title' | 'area' | 'status' | 'priority'>[]): Promise<Goal[]> {
  if (!inputs.length) return [];
  const { data, error } = await client().from('goals').insert(inputs).select();
  fail(error);
  return (data ?? []).map((row) => ({ ...row, progress: 0 })) as Goal[];
}

export async function updateGoalStatus(id: Goal['id'], status: Status) {
  const { error } = await client().from('goals').update({ status }).eq('id', String(id));
  fail(error);
}

export async function deleteGoal(id: Goal['id']) {
  const { error } = await client().from('goals').delete().eq('id', String(id));
  fail(error);
}

export async function getSpaces(): Promise<string[]> {
  const { data, error } = await client().from('spaces').select('name').order('created_at');
  fail(error);
  return (data ?? []).map((row) => row.name);
}

export async function createSpace(name: string) {
  const { error } = await client().from('spaces').upsert({ name }, { onConflict: 'owner_id,name', ignoreDuplicates: true });
  fail(error);
}

export async function createSpaces(names: string[]) {
  if (!names.length) return;
  const { error } = await client().from('spaces').upsert(
    names.map((name) => ({ name })),
    { onConflict: 'owner_id,name', ignoreDuplicates: true }
  );
  fail(error);
}

export async function getCalendarNotes(): Promise<CalendarNote[]> {
  const { data, error } = await client().from('calendar_notes').select('*')
    .order('note_date')
    .order('sort_order')
    .order('created_at');
  fail(error);
  return (data ?? []).map((row) => ({ ...row, date: row.note_date, sortOrder: row.sort_order })) as CalendarNote[];
}

export async function createCalendarNote(input: Omit<CalendarNote, 'id'>): Promise<CalendarNote> {
  const { data, error } = await client().from('calendar_notes')
    .insert({ note_date: input.date, title: input.title, text: input.text, sort_order: input.sortOrder })
    .select().single();
  fail(error);
  return { ...data, date: data.note_date, sortOrder: data.sort_order } as CalendarNote;
}

export async function createCalendarNotes(inputs: Omit<CalendarNote, 'id'>[]): Promise<CalendarNote[]> {
  if (!inputs.length) return [];
  const { data, error } = await client().from('calendar_notes')
    .insert(inputs.map((item) => ({ note_date: item.date, title: item.title, text: item.text, sort_order: item.sortOrder })))
    .select();
  fail(error);
  return (data ?? []).map((row) => ({ ...row, date: row.note_date, sortOrder: row.sort_order })) as CalendarNote[];
}

export async function deleteCalendarNote(id: CalendarNote['id']) {
  const { error } = await client().from('calendar_notes').delete().eq('id', String(id));
  fail(error);
}

export async function updateCalendarNoteOrder(items: Pick<CalendarNote, 'id' | 'sortOrder'>[]) {
  await Promise.all(items.map(async (item) => {
    const { error } = await client().from('calendar_notes')
      .update({ sort_order: item.sortOrder })
      .eq('id', String(item.id));
    fail(error);
  }));
}

export async function moveCalendarNoteToDate(id: CalendarNote['id'], date: string, sortOrder: number) {
  const { error } = await client().from('calendar_notes')
    .update({ note_date: date, sort_order: sortOrder })
    .eq('id', String(id));
  fail(error);
}

export async function getUsefulLinks(): Promise<UsefulLink[]> {
  const { data, error } = await client().from('useful_links').select('*').order('created_at');
  fail(error);
  return (data ?? []) as UsefulLink[];
}

export async function createUsefulLink(input: Omit<UsefulLink, 'id'>): Promise<UsefulLink> {
  const { data, error } = await client().from('useful_links').insert(input).select().single();
  fail(error);
  return data as UsefulLink;
}

export async function createUsefulLinks(inputs: Omit<UsefulLink, 'id'>[]): Promise<UsefulLink[]> {
  if (!inputs.length) return [];
  const { data, error } = await client().from('useful_links').insert(inputs).select();
  fail(error);
  return (data ?? []) as UsefulLink[];
}

export async function deleteUsefulLink(id: UsefulLink['id']) {
  const { error } = await client().from('useful_links').delete().eq('id', String(id));
  fail(error);
}

export async function getDailyCheckIns(): Promise<DailyCheckIn[]> {
  const { data, error } = await client().from('daily_check_ins').select('*').order('check_in_date', { ascending: false });
  fail(error);
  return (data ?? []).map((row) => ({ ...row, date: row.check_in_date })) as DailyCheckIn[];
}

export async function saveDailyCheckIn(input: Omit<DailyCheckIn, 'id'>): Promise<DailyCheckIn> {
  const { data, error } = await client().from('daily_check_ins')
    .upsert({
      check_in_date: input.date,
      mood: input.mood,
      energy: input.energy,
      highlight: input.highlight,
      blockers: input.blockers,
      notes: input.notes
    }, { onConflict: 'owner_id,check_in_date' })
    .select()
    .single();
  fail(error);
  return { ...data, date: data.check_in_date } as DailyCheckIn;
}

export async function getRoutines(): Promise<Routine[]> {
  const { data, error } = await client().from('routines').select('id,title').order('created_at');
  fail(error);
  return (data ?? []) as Routine[];
}

export async function createRoutine(title: string): Promise<Routine> {
  const { data, error } = await client().from('routines').insert({ title }).select('id,title').single();
  fail(error);
  return data as Routine;
}

export async function createRoutines(titles: string[]): Promise<Routine[]> {
  if (!titles.length) return [];
  const { data, error } = await client().from('routines').insert(titles.map((title) => ({ title }))).select('id,title');
  fail(error);
  return (data ?? []) as Routine[];
}

export async function deleteRoutine(id: Routine['id']) {
  const { error } = await client().from('routines').delete().eq('id', String(id));
  fail(error);
}

export async function getRoutineCompletions(): Promise<RoutineCompletion[]> {
  const { data, error } = await client().from('routine_completions').select('routine_id,completion_date');
  fail(error);
  return (data ?? []).map((row) => ({ routineId: row.routine_id, date: row.completion_date })) as RoutineCompletion[];
}

export async function setRoutineCompletion(routineId: Routine['id'], date: string, completed: boolean) {
  if (completed) {
    const { error } = await client().from('routine_completions')
      .upsert({ routine_id: String(routineId), completion_date: date }, { onConflict: 'routine_id,completion_date' });
    fail(error);
  } else {
    const { error } = await client().from('routine_completions')
      .delete().eq('routine_id', String(routineId)).eq('completion_date', date);
    fail(error);
  }
}

export async function getIdeaTypes(): Promise<IdeaType[]> {
  const { data, error } = await client().from('idea_types').select('id,name').order('created_at');
  fail(error);
  return (data ?? []) as IdeaType[];
}

export async function createIdeaType(name: string): Promise<IdeaType> {
  const { data, error } = await client().from('idea_types').insert({ name }).select('id,name').single();
  fail(error);
  return data as IdeaType;
}

export async function createIdeaTypes(names: string[]): Promise<IdeaType[]> {
  if (!names.length) return [];
  const { data, error } = await client().from('idea_types')
    .insert(names.map((name) => ({ name })))
    .select('id,name');
  fail(error);
  return (data ?? []) as IdeaType[];
}

export async function deleteIdeaType(id: IdeaType['id']) {
  const { error } = await client().from('idea_types').delete().eq('id', String(id));
  fail(error);
}

export async function getIdeas(): Promise<Idea[]> {
  const { data, error } = await client().from('ideas').select('id,title,description,type_id').order('created_at', { ascending: false });
  fail(error);
  return (data ?? []).map((row) => ({ ...row, typeId: row.type_id })) as Idea[];
}

export async function createIdea(input: Omit<Idea, 'id'>): Promise<Idea> {
  const { data, error } = await client().from('ideas')
    .insert({ title: input.title, description: input.description, type_id: String(input.typeId) })
    .select('id,title,description,type_id')
    .single();
  fail(error);
  if (!data) throw new Error('Не удалось создать идею');
  return { ...data, typeId: data.type_id } as Idea;
}

export async function deleteIdea(id: Idea['id']) {
  const { error } = await client().from('ideas').delete().eq('id', String(id));
  fail(error);
}

export async function getIdeaGoalLinks(): Promise<IdeaGoalLink[]> {
  const { data, error } = await client().from('idea_goal_links').select('idea_id,goal_id');
  fail(error);
  return (data ?? []).map((row) => ({ ideaId: row.idea_id, goalId: row.goal_id })) as IdeaGoalLink[];
}

export async function setIdeaGoalLink(ideaId: Idea['id'], goalId: Goal['id'], linked: boolean) {
  if (linked) {
    const { error } = await client().from('idea_goal_links')
      .upsert({ idea_id: String(ideaId), goal_id: String(goalId) }, { onConflict: 'idea_id,goal_id' });
    fail(error);
  } else {
    const { error } = await client().from('idea_goal_links')
      .delete().eq('idea_id', String(ideaId)).eq('goal_id', String(goalId));
    fail(error);
  }
}

export function goalInput(goal: Goal): Pick<Goal, 'title' | 'area' | 'status' | 'priority'> {
  return {
    title: goal.title,
    area: goal.area,
    status: goal.status as Status,
    priority: goal.priority as Priority
  };
}
