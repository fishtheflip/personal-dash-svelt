<script lang="ts">
  import { onMount } from 'svelte';
  import { Badge, Button, Card, Input, Textarea } from 'flowbite-svelte';
  import {
    BatteryCharging, CalendarDays, Check, CheckCircle2, ClipboardCheck, CloudSun, Plus, Save, Trash2
  } from '@lucide/svelte';
  import AppNavigation from '$lib/AppNavigation.svelte';
  import {
    createRoutine, createRoutines, deleteRoutine, getDailyCheckIns, getRoutineCompletions,
    getRoutines, saveDailyCheckIn, setRoutineCompletion
  } from '$lib/data';
  import type { DailyCheckIn, Routine, RoutineCompletion } from '$lib/types';

  const levels = [1, 2, 3, 4, 5];
  const defaultRoutines = ['Стакан воды утром', 'Разминка', 'Чтение 20 минут'];
  let entries = $state<DailyCheckIn[]>([]);
  let routines = $state<Routine[]>([]);
  let completions = $state<RoutineCompletion[]>([]);
  let selectedDate = $state(dateKey(new Date()));
  let mood = $state(3);
  let energy = $state(3);
  let highlight = $state('');
  let blockers = $state('');
  let notes = $state('');
  let loading = $state(true);
  let saving = $state(false);
  let saved = $state(false);
  let errorMessage = $state('');
  let newRoutine = $state('');
  let routineSavingIds = $state<Set<Routine['id']>>(new Set());

  let completedToday = $derived(routines.filter((routine) => isRoutineCompleted(routine.id, selectedDate)).length);

  onMount(loadData);

  function dateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async function loadData() {
    const [entriesResult, routinesResult, completionsResult] = await Promise.allSettled([
      getDailyCheckIns(), getRoutines(), getRoutineCompletions()
    ]);

    if (entriesResult.status === 'fulfilled') {
      entries = entriesResult.value;
      loadDate(selectedDate);
    } else {
      errorMessage = checkInError(entriesResult.reason);
    }

    if (routinesResult.status === 'fulfilled') {
      try {
        routines = routinesResult.value.length ? routinesResult.value : await createRoutines(defaultRoutines);
      } catch (error) {
        errorMessage = checkInError(error);
      }
    } else {
      errorMessage = checkInError(routinesResult.reason);
    }

    if (completionsResult.status === 'fulfilled') {
      completions = completionsResult.value;
    } else {
      errorMessage = checkInError(completionsResult.reason);
    }

    loading = false;
  }

  function loadDate(date: string) {
    selectedDate = date;
    const entry = entries.find((item) => item.date === date);
    mood = entry?.mood ?? 3;
    energy = entry?.energy ?? 3;
    highlight = entry?.highlight ?? '';
    blockers = entry?.blockers ?? '';
    notes = entry?.notes ?? '';
    saved = false;
  }

  async function save() {
    saving = true;
    saved = false;
    errorMessage = '';
    try {
      const entry = await saveDailyCheckIn({
        date: selectedDate, mood, energy, highlight: highlight.trim(),
        blockers: blockers.trim(), notes: notes.trim()
      });
      entries = [entry, ...entries.filter((item) => item.date !== entry.date)]
        .sort((a, b) => b.date.localeCompare(a.date));
      saved = true;
    } catch (error) {
      errorMessage = checkInError(error);
    } finally {
      saving = false;
    }
  }

  function dateLabel(date: string) {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' })
      .format(new Date(`${date}T12:00:00`));
  }

  function checkInError(error: unknown) {
    const message = error instanceof Error ? error.message : '';
    return message.includes('daily_check_ins')
      ? 'Выполните миграцию supabase/migrations/202606090001_daily_check_ins.sql в Supabase SQL Editor.'
      : message.includes('routines') || message.includes('routine_completions')
        ? 'Выполните миграцию supabase/migrations/202606110001_routines.sql в Supabase SQL Editor.'
      : message || 'Не удалось обработать чек-ин';
  }

  function isRoutineCompleted(routineId: Routine['id'], date: string) {
    return completions.some((item) => String(item.routineId) === String(routineId) && item.date === date);
  }

  async function toggleRoutine(routine: Routine) {
    const completed = !isRoutineCompleted(routine.id, selectedDate);
    routineSavingIds = new Set([...routineSavingIds, routine.id]);
    try {
      await setRoutineCompletion(routine.id, selectedDate, completed);
      completions = completed
        ? [...completions, { routineId: routine.id, date: selectedDate }]
        : completions.filter((item) => !(String(item.routineId) === String(routine.id) && item.date === selectedDate));
    } catch (error) {
      errorMessage = checkInError(error);
    } finally {
      routineSavingIds = new Set([...routineSavingIds].filter((id) => id !== routine.id));
    }
  }

  async function addRoutine() {
    const title = newRoutine.trim();
    if (!title) return;
    try {
      routines = [...routines, await createRoutine(title)];
      newRoutine = '';
    } catch (error) {
      errorMessage = checkInError(error);
    }
  }

  async function removeRoutine(routine: Routine) {
    try {
      await deleteRoutine(routine.id);
      routines = routines.filter((item) => item.id !== routine.id);
      completions = completions.filter((item) => String(item.routineId) !== String(routine.id));
    } catch (error) {
      errorMessage = checkInError(error);
    }
  }
</script>

<svelte:head><title>Ежедневный чек-ин</title></svelte:head>

<div class="min-h-screen bg-gray-950 text-white">
  <AppNavigation active="check-in"/>

  <main class="lg:ml-64">
    <div class="mx-auto max-w-6xl p-5 lg:p-8">
      <div class="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div class="mb-2 flex items-center gap-2 text-xs font-medium text-lime-400"><ClipboardCheck size={14}/> Ежедневное обновление</div>
          <h1 class="text-4xl font-bold tracking-tight">Чек-ин</h1>
          <p class="mt-2 text-sm text-gray-500">Зафиксируй состояние, результат и то, что мешает двигаться дальше.</p>
        </div>
        <label class="text-xs text-gray-400">Дата<input type="date" bind:value={selectedDate} onchange={() => loadDate(selectedDate)} class="ml-3 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"/></label>
      </div>

      {#if errorMessage}<div class="mb-5 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{errorMessage}</div>{/if}

      <Card class="mb-5 max-w-none border-gray-800 bg-gray-900 p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div><div class="flex items-center gap-2 font-semibold"><CheckCircle2 size={17} class="text-lime-400"/> Ежедневные рутины</div><p class="mt-1 text-xs text-gray-500">Отметки сохраняются отдельно для каждой даты.</p></div>
          <Badge color={completedToday === routines.length && routines.length ? 'green' : 'gray'}>{completedToday} / {routines.length}</Badge>
        </div>
        <div class="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {#each routines as routine}
            <div class="flex items-center gap-2 rounded-lg border p-2 {isRoutineCompleted(routine.id, selectedDate) ? 'border-lime-400/50 bg-lime-400/10' : 'border-gray-700 bg-gray-800'}">
              <button class="flex min-w-0 flex-1 items-center gap-3 text-left text-sm" disabled={routineSavingIds.has(routine.id)} onclick={() => toggleRoutine(routine)}>
                <span class="grid size-6 shrink-0 place-items-center rounded-md border {isRoutineCompleted(routine.id, selectedDate) ? 'border-lime-400 bg-lime-400 text-gray-950' : 'border-gray-600 text-transparent'}"><Check size={14}/></span>
                <span class="truncate {isRoutineCompleted(routine.id, selectedDate) ? 'text-gray-300 line-through' : 'text-white'}">{routine.title}</span>
              </button>
              <Button color="dark" size="xs" onclick={() => removeRoutine(routine)} aria-label={`Удалить рутину: ${routine.title}`}><Trash2 size={13}/></Button>
            </div>
          {/each}
        </div>
        <form class="mt-4 flex gap-2" onsubmit={(event) => { event.preventDefault(); addRoutine(); }}>
          <Input bind:value={newRoutine} class="border-gray-700 bg-gray-800 text-white" placeholder="Добавить ежедневную рутину"/>
          <Button type="submit" color="green"><Plus size={15}/> Добавить</Button>
        </form>
      </Card>

      <div class="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card class="max-w-none border-gray-800 bg-gray-900 p-5">
          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <div class="mb-3 flex items-center gap-2 text-sm font-semibold"><CloudSun size={16} class="text-lime-400"/> Настроение</div>
              <div class="grid grid-cols-5 gap-2">
                {#each levels as level}<Button color={mood === level ? 'green' : 'dark'} onclick={() => mood = level}>{level}</Button>{/each}
              </div>
            </div>
            <div>
              <div class="mb-3 flex items-center gap-2 text-sm font-semibold"><BatteryCharging size={16} class="text-lime-400"/> Энергия</div>
              <div class="grid grid-cols-5 gap-2">
                {#each levels as level}<Button color={energy === level ? 'green' : 'dark'} onclick={() => energy = level}>{level}</Button>{/each}
              </div>
            </div>
          </div>

          <label class="mt-6 block text-sm text-gray-400">Главный результат дня<Textarea bind:value={highlight} rows={3} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="Что сегодня действительно продвинулось?"/></label>
          <label class="mt-5 block text-sm text-gray-400">Блокеры<Textarea bind:value={blockers} rows={3} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="Что мешает или требует решения?"/></label>
          <label class="mt-5 block text-sm text-gray-400">Заметка<Textarea bind:value={notes} rows={4} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="Мысли, наблюдения, следующий шаг"/></label>

          <Button color="green" class="mt-6 w-full justify-center" onclick={save} disabled={saving}>
            {#if saved}<Check size={16}/> Сохранено{:else}<Save size={16}/> {saving ? 'Сохраняем...' : 'Сохранить чек-ин'}{/if}
          </Button>
        </Card>

        <Card class="max-w-none border-gray-800 bg-gray-900 p-4">
          <div class="mb-4 flex items-center gap-2"><CalendarDays size={16} class="text-lime-400"/><h2 class="font-semibold">История</h2><Badge color="gray" class="ml-auto">{entries.length}</Badge></div>
          <div class="space-y-2">
            {#if loading}
              <p class="py-8 text-center text-sm text-gray-500">Загрузка...</p>
            {:else}
              {#each entries as entry}
                <button onclick={() => loadDate(entry.date)} class="w-full rounded-lg border p-3 text-left transition {selectedDate === entry.date ? 'border-lime-400 bg-lime-400/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}">
                  <div class="flex items-center justify-between gap-3"><strong class="text-sm capitalize">{dateLabel(entry.date)}</strong><span class="text-xs text-gray-500">{entry.mood}/5 · {entry.energy}/5</span></div>
                  {#if entry.highlight}<p class="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-400">{entry.highlight}</p>{/if}
                </button>
              {:else}
                <div class="rounded-lg border border-dashed border-gray-700 p-7 text-center text-sm text-gray-500">Чек-инов пока нет</div>
              {/each}
            {/if}
          </div>
        </Card>
      </div>
    </div>
  </main>
</div>
