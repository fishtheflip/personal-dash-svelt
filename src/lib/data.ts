import type { CalendarNote, Goal, Priority, Status, UsefulLink } from '$lib/types';
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
  const { data, error } = await client().from('calendar_notes').select('*').order('created_at');
  fail(error);
  return (data ?? []).map((row) => ({ ...row, date: row.note_date })) as CalendarNote[];
}

export async function createCalendarNote(input: Omit<CalendarNote, 'id'>): Promise<CalendarNote> {
  const { data, error } = await client().from('calendar_notes')
    .insert({ note_date: input.date, title: input.title, text: input.text })
    .select().single();
  fail(error);
  return { ...data, date: data.note_date } as CalendarNote;
}

export async function createCalendarNotes(inputs: Omit<CalendarNote, 'id'>[]): Promise<CalendarNote[]> {
  if (!inputs.length) return [];
  const { data, error } = await client().from('calendar_notes')
    .insert(inputs.map((item) => ({ note_date: item.date, title: item.title, text: item.text })))
    .select();
  fail(error);
  return (data ?? []).map((row) => ({ ...row, date: row.note_date })) as CalendarNote[];
}

export async function deleteCalendarNote(id: CalendarNote['id']) {
  const { error } = await client().from('calendar_notes').delete().eq('id', String(id));
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

export function goalInput(goal: Goal): Pick<Goal, 'title' | 'area' | 'status' | 'priority'> {
  return {
    title: goal.title,
    area: goal.area,
    status: goal.status as Status,
    priority: goal.priority as Priority
  };
}
