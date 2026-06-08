<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import {
    Badge, Button, Card, Input, Modal, Textarea
  } from 'flowbite-svelte';
  import {
    CalendarDays, ChevronLeft, ChevronRight, Plus, Search, Trash2
  } from '@lucide/svelte';
  import AppNavigation from '$lib/AppNavigation.svelte';
  import type { CalendarNote } from '$lib/types';
  import {
    createCalendarNote, createCalendarNotes, deleteCalendarNote, getCalendarNotes
  } from '$lib/data';

  type Note = Omit<CalendarNote, 'date'>;

  const storageKey = 'goal-planner-calendar-notes';
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  let current = $state(new Date());
  let selectedKey = $state(dateKey(new Date()));
  let notes = $state<Record<string, Note[]>>({});
  let loading = $state(true);
  let errorMessage = $state('');
  let showCreate = $state(false);
  let title = $state('');
  let text = $state('');
  let query = $state('');

  let days = $derived(buildCalendar(current));
  let selectedNotes = $derived((notes[selectedKey] ?? []).filter((note) =>
    `${note.title} ${note.text}`.toLowerCase().includes(query.toLowerCase())
  ));

  function dateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function buildCalendar(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(year, month, index - offset + 1);
      return { date: day, key: dateKey(day), currentMonth: day.getMonth() === month };
    });
  }

  function loadNotes(): Record<string, Note[]> {
    if (!browser) return {};
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Record<string, Note[]>;
    } catch {
      return {};
    }
  }

  function changeMonth(amount: number) {
    current = new Date(current.getFullYear(), current.getMonth() + amount, 1);
  }

  onMount(async () => {
    try {
      let stored = await getCalendarNotes();
      if (!stored.length) {
        const local = loadNotes();
        stored = await createCalendarNotes(Object.entries(local).flatMap(([date, items]) =>
          items.map((item) => ({ date, title: item.title, text: item.text }))
        ));
      }
      notes = stored.reduce<Record<string, Note[]>>((result, item) => {
        result[item.date] = [...(result[item.date] ?? []), { id: item.id, title: item.title, text: item.text }];
        return result;
      }, {});
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Не удалось загрузить заметки';
    } finally {
      loading = false;
    }
  });

  async function addNote() {
    if (!title.trim()) return;
    try {
      const created = await createCalendarNote({ date: selectedKey, title: title.trim(), text: text.trim() });
      notes[selectedKey] = [...(notes[selectedKey] ?? []), { id: created.id, title: created.title, text: created.text }];
      title = '';
      text = '';
      showCreate = false;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Не удалось добавить заметку';
    }
  }

  async function deleteNote(id: Note['id']) {
    try {
      await deleteCalendarNote(id);
      notes[selectedKey] = (notes[selectedKey] ?? []).filter((note) => note.id !== id);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Не удалось удалить заметку';
    }
  }

  function selectedDateLabel() {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
      .format(new Date(`${selectedKey}T12:00:00`));
  }
</script>

<svelte:head><title>Календарь задач</title></svelte:head>

<div class="min-h-screen bg-gray-950 text-white">
  <AppNavigation active="calendar"/>

  <main class="lg:ml-64">
    <Card class="sticky top-0 z-20 w-full max-w-none rounded-none border-x-0 border-t-0 border-gray-800 bg-gray-950/95 p-3 backdrop-blur lg:px-8">
      <div class="flex items-center gap-3">
        <div class="w-full max-w-md"><Input bind:value={query} divClass="w-full" class="w-full border-gray-700 bg-gray-900 pl-11 text-white" leftClass="pointer-events-none w-10 justify-center text-gray-400" placeholder="Поиск заметок...">{#snippet left()}<Search size={15}/>{/snippet}</Input></div>
        <Button color="green" class="ml-auto" onclick={() => showCreate = true}><Plus size={16}/> Новая заметка</Button>
      </div>
    </Card>

    <div class="p-5 lg:p-8">
      {#if errorMessage}<div class="mb-5 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{errorMessage}</div>{/if}
      <div class="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><div class="mb-2 flex items-center gap-2 text-xs font-medium text-lime-400"><CalendarDays size={14}/> Планирование по датам</div><h1 class="text-4xl font-bold tracking-tight">Календарь</h1><p class="mt-2 text-sm text-gray-500">Выбери день и оставь заметку.</p></div>
        <div class="flex items-center gap-2"><Button color="dark" size="sm" onclick={() => changeMonth(-1)} aria-label="Предыдущий месяц"><ChevronLeft size={16}/></Button><strong class="min-w-40 text-center">{months[current.getMonth()]} {current.getFullYear()}</strong><Button color="dark" size="sm" onclick={() => changeMonth(1)} aria-label="Следующий месяц"><ChevronRight size={16}/></Button></div>
      </div>

      <div class="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card class="max-w-none border-gray-800 bg-gray-900 p-3">
          <div class="grid grid-cols-7">{#each weekdays as weekday}<div class="p-2 text-center text-xs font-semibold uppercase text-gray-500">{weekday}</div>{/each}</div>
          <div class="grid grid-cols-7 overflow-hidden rounded-lg border border-gray-800 {loading ? 'opacity-50' : ''}">
            {#each days as day}
              <button onclick={() => selectedKey = day.key} class="relative min-h-24 border-b border-r border-gray-800 p-2 text-left transition hover:bg-gray-800 {selectedKey === day.key ? 'bg-lime-400/10 ring-1 ring-inset ring-lime-400' : 'bg-gray-900'} {day.currentMonth ? 'text-white' : 'text-gray-600'}">
                <span class="text-xs">{day.date.getDate()}</span>
                {#if notes[day.key]?.length}<Badge color="green" class="absolute bottom-2 right-2">{notes[day.key].length}</Badge>{/if}
              </button>
            {/each}
          </div>
        </Card>

        <Card class="max-w-none border-gray-800 bg-gray-900 p-4">
          <div class="mb-4 flex items-center justify-between"><div><div class="text-xs uppercase tracking-wide text-gray-500">Заметки на дату</div><h2 class="mt-1 font-semibold capitalize">{selectedDateLabel()}</h2></div><Button color="green" size="sm" onclick={() => showCreate = true}><Plus size={15}/></Button></div>
          <div class="space-y-3">
            {#each selectedNotes as note}
              <Card class="max-w-none border-gray-700 bg-gray-800 p-3">
                <div class="flex items-start gap-3"><div class="min-w-0 flex-1"><h3 class="text-sm font-semibold">{note.title}</h3>{#if note.text}<p class="mt-1 text-xs leading-relaxed text-gray-400">{note.text}</p>{/if}</div><Button color="red" size="xs" outline onclick={() => deleteNote(note.id)} aria-label="Удалить заметку"><Trash2 size={13}/></Button></div>
              </Card>
            {:else}
              <div class="rounded-lg border border-dashed border-gray-700 p-8 text-center text-sm text-gray-500">На этот день заметок нет</div>
            {/each}
          </div>
        </Card>
      </div>
    </div>
  </main>
</div>

<Modal bind:open={showCreate} title="Новая заметка" size="md" class="border border-gray-700 bg-gray-900 text-white" headerClass="border-b border-gray-700 bg-gray-900 text-white" bodyClass="bg-gray-900" closeBtnClass="text-gray-400 hover:bg-gray-800">
  <form onsubmit={(event) => { event.preventDefault(); addNote(); }}>
    <p class="mb-5 text-sm capitalize text-gray-500">{selectedDateLabel()}</p>
    <label class="block text-sm text-gray-400">Заголовок<Input bind:value={title} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="Что важно сделать?"/></label>
    <label class="mt-4 block text-sm text-gray-400">Описание<Textarea bind:value={text} rows={4} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="Дополнительные детали"/></label>
    <Button type="submit" color="green" class="mt-5 w-full justify-center"><Plus size={16}/> Добавить заметку</Button>
  </form>
</Modal>
