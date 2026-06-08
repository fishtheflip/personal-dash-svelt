<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import {
    Badge, Button, ButtonGroup, Card, Input, Modal, Select
  } from 'flowbite-svelte';
  import {
    ArrowLeft, ArrowRight, Command, GripVertical, Plus, Search, Sparkles, Trash2
  } from '@lucide/svelte';
  import AppNavigation from '$lib/AppNavigation.svelte';
  import type { Goal, Priority, Status } from '$lib/types';
  import {
    createGoal as insertGoal, createGoals, createSpace, createSpaces, deleteGoal as removeGoal,
    getGoals, getSpaces, goalInput, updateGoalStatus
  } from '$lib/data';

  const storageKey = 'northstar-kanban-goals';
  const spacesKey = 'northstar-kanban-spaces';
  const defaultSpaces = ['Разработка', 'Обучение', 'Личные', 'Breaking', 'Art'];
  const defaultGoals: Goal[] = [
    { id: 1, title: 'Проверить авторизацию DP / DP-Test Web', area: 'Разработка', status: 'progress', priority: 'high', progress: 40 },
    { id: 2, title: 'Проверить авторизацию DP / DP-Test WebView', area: 'Разработка', status: 'backlog', priority: 'high', progress: 0 },
    { id: 3, title: 'Проверить авторизацию DP / DP-Test Mobile', area: 'Разработка', status: 'backlog', priority: 'high', progress: 0 },
    { id: 4, title: 'Записать найденные багфиксы', area: 'Разработка', status: 'backlog', priority: 'medium', progress: 0 },
    { id: 5, title: 'Реализовать logout', area: 'Разработка', status: 'progress', priority: 'high', progress: 30 },
    { id: 6, title: 'Проверить DP в Lighthouse', area: 'Обучение', status: 'backlog', priority: 'medium', progress: 0 }
  ];

  let goals = $state<Goal[]>([]);
  let spaces = $state<string[]>(defaultSpaces);
  let loading = $state(true);
  let errorMessage = $state('');
  let query = $state('');
  let area = $state('Все');
  let priority = $state<'all' | Priority>('all');
  let showCreate = $state(false);
  let newTitle = $state('');
  let newArea = $state('Разработка');
  let newPriority = $state<Priority>('medium');
  let customSpace = $state('');
  let draggedId = $state<Goal['id'] | null>(null);
  let dragOverStatus = $state<Status | null>(null);
  let savingIds = $state<Set<Goal['id']>>(new Set());
  let goalToDelete = $state<Goal | null>(null);
  let showDelete = $state(false);
  let deleting = $state(false);

  const columns: { id: Status; label: string; subtitle: string; color: string }[] = [
    { id: 'backlog', label: 'Запланировано', subtitle: 'Следующие задачи', color: '#9ca3af' },
    { id: 'progress', label: 'В работе', subtitle: 'Активный фокус', color: '#84cc16' },
    { id: 'done', label: 'Готово', subtitle: 'Завершено', color: '#38bdf8' }
  ];
  let areas = $derived(['Все', ...spaces]);
  let areaOptions = $derived(spaces.map((item) => ({ name: item, value: item })));
  const priorityOptions = [
    { name: 'Все приоритеты', value: 'all' },
    { name: 'Высокий', value: 'high' },
    { name: 'Средний', value: 'medium' },
    { name: 'Низкий', value: 'low' }
  ];
  const createPriorityOptions = priorityOptions.slice(1);
  const badgeColor: Record<Priority, 'red' | 'yellow' | 'gray'> = {
    high: 'red', medium: 'yellow', low: 'gray'
  };

  let filtered = $derived(goals.filter((goal) =>
    `${goal.title} ${goal.area} ${goal.priority}`.toLowerCase().includes(query.toLowerCase())
    && (area === 'Все' || goal.area === area)
    && (priority === 'all' || goal.priority === priority)
  ));

  function loadGoals(): Goal[] {
    if (!browser) return defaultGoals;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as Goal[]).map(normalizeGoal) : defaultGoals;
    } catch {
      return defaultGoals;
    }
  }

  function loadSpaces(): string[] {
    if (!browser) return defaultSpaces;
    try {
      const stored = localStorage.getItem(spacesKey);
      return stored ? mergeSpaces(JSON.parse(stored) as string[]) : mergeSpaces(defaultGoals.map((goal) => goal.area));
    } catch {
      return defaultSpaces;
    }
  }

  function mergeSpaces(items: string[]) {
    return Array.from(new Set([...defaultSpaces, ...items.map((item) => item.trim()).filter(Boolean)]));
  }

  function normalizeGoal(goal: Goal): Goal {
    const legacyPriority: Record<string, Priority> = {
      Разработка: 'high',
      Обучение: 'medium',
      Личные: 'medium',
      Брейк: 'low',
      Творчество: 'medium'
    };
    const legacyArea: Record<string, string> = {
      'DP Testing': 'Разработка',
      'Багфиксы': 'Разработка',
      'Брейк': 'Breaking',
      'Творчество': 'Art'
    };
    return {
      ...goal,
      area: legacyArea[goal.area] ?? goal.area,
      priority: legacyPriority[goal.priority] ?? goal.priority
    };
  }

  onMount(async () => {
    try {
      const [storedGoals, storedSpaces] = await Promise.all([getGoals(), getSpaces()]);
      goals = storedGoals.length ? storedGoals : await createGoals(loadGoals().map(goalInput));
      const initialSpaces = mergeSpaces(storedSpaces.length ? storedSpaces : loadSpaces());
      if (!storedSpaces.length) await createSpaces(initialSpaces);
      spaces = initialSpaces;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Не удалось загрузить данные';
    } finally {
      loading = false;
    }
  });

  async function addSpace() {
    const value = customSpace.trim();
    if (!value || spaces.includes(value)) return;
    try {
      await createSpace(value);
      spaces = [...spaces, value];
      newArea = value;
      customSpace = '';
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Не удалось добавить пространство';
    }
  }

  async function setGoalStatus(goal: Goal, status: Status) {
    if (goal.status === status || savingIds.has(goal.id)) return;
    const previous = goal.status;
    savingIds = new Set([...savingIds, goal.id]);
    goals = goals.map((item) => item.id === goal.id ? { ...item, status } : item);
    try {
      await updateGoalStatus(goal.id, status);
    } catch (error) {
      goals = goals.map((item) => item.id === goal.id ? { ...item, status: previous } : item);
      errorMessage = error instanceof Error ? error.message : 'Не удалось переместить цель';
    } finally {
      savingIds = new Set([...savingIds].filter((id) => id !== goal.id));
    }
  }

  function move(goal: Goal, direction: -1 | 1) {
    const order: Status[] = ['backlog', 'progress', 'done'];
    void setGoalStatus(goal, order[Math.max(0, Math.min(2, order.indexOf(goal.status) + direction))]);
  }

  async function createGoal() {
    if (!newTitle.trim()) return;
    try {
      const created = await insertGoal({
        title: newTitle.trim(), area: newArea, status: 'backlog', priority: newPriority
      });
      goals = [...goals, created];
      newTitle = '';
      showCreate = false;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Не удалось создать цель';
    }
  }

  async function deleteGoal() {
    if (!goalToDelete || deleting) return;
    deleting = true;
    errorMessage = '';
    try {
      await removeGoal(goalToDelete.id);
      goals = goals.filter((goal) => goal.id !== goalToDelete?.id);
      goalToDelete = null;
      showDelete = false;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Не удалось удалить цель';
    } finally {
      deleting = false;
    }
  }

  function startDrag(event: DragEvent, goal: Goal) {
    draggedId = goal.id;
    event.dataTransfer?.setData('text/plain', String(goal.id));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  async function dropGoal(event: DragEvent, status: Status) {
    event.preventDefault();
    const id = draggedId ?? event.dataTransfer?.getData('text/plain');
    const goal = goals.find((item) => String(item.id) === String(id));
    if (goal) await setGoalStatus(goal, status);
    draggedId = null;
    dragOverStatus = null;
  }
</script>

<svelte:head><title>Канбан — Northstar</title></svelte:head>

<div class="min-h-screen bg-gray-950 text-white">
  <AppNavigation active="kanban" kanbanCount={goals.length}/>

  <main class="lg:ml-64">
    <Card class="sticky top-0 z-20 w-full max-w-none rounded-none border-x-0 border-t-0 border-gray-800 bg-gray-950/95 p-3 backdrop-blur lg:px-8">
      <div class="flex items-center gap-3">
        <div class="w-full max-w-md flex-1"><Input bind:value={query} divClass="w-full" class="w-full border-gray-700 bg-gray-900 pl-11 text-white" leftClass="pointer-events-none w-10 justify-center text-gray-400" placeholder="Поиск на доске...">{#snippet left()}<Search size={15}/>{/snippet}</Input></div>
        <Button color="green" onclick={() => showCreate = true}><Plus size={16}/> Новая цель</Button>
      </div>
    </Card>

    <div class="p-5 lg:p-8">
      {#if errorMessage}<div class="mb-5 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{errorMessage}</div>{/if}
      <div class="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div><div class="mb-2 flex items-center gap-2 text-xs font-medium text-lime-400"><Sparkles size={14}/> Рабочее пространство</div><h1 class="text-4xl font-bold tracking-tight">Канбан целей</h1><p class="mt-2 text-sm text-gray-500">Веди задачи от намерения до результата.</p></div>
        <div class="flex flex-wrap gap-2">
          <ButtonGroup>
            {#each areas as item}<Button color={area === item ? 'dark' : 'alternative'} onclick={() => area = item}>{item}</Button>{/each}
          </ButtonGroup>
          <div class="w-48"><Select bind:value={priority} items={priorityOptions} class="border-gray-700 bg-gray-900 text-white"/></div>
        </div>
      </div>

      <div class="mb-5 grid gap-3 sm:grid-cols-3">
        {#each columns as column}
          <Card class="border-gray-800 bg-gray-900 p-4">
            <div class="flex items-center gap-3"><span class="size-2.5 rounded-full" style={`background:${column.color}`}></span><div><div class="text-xs text-gray-500">{column.label}</div><div class="text-xl font-bold">{goals.filter(g => g.status === column.id).length}</div></div><span class="ml-auto text-[10px] uppercase tracking-wider text-gray-600">{column.subtitle}</span></div>
          </Card>
        {/each}
      </div>

      {#if loading}
        <div class="rounded-lg border border-gray-800 bg-gray-900 p-10 text-center text-sm text-gray-500">Загрузка целей...</div>
      {:else}
      <div class="grid min-w-[900px] grid-cols-3 gap-4">
        {#each columns as column}
          <Card
            role="list"
            aria-label={column.label}
            ondragenter={(event: DragEvent) => { event.preventDefault(); dragOverStatus = column.id; }}
            ondragover={(event: DragEvent) => { event.preventDefault(); dragOverStatus = column.id; }}
            ondragleave={(event: DragEvent) => { if (event.currentTarget === event.target) dragOverStatus = null; }}
            ondrop={(event: DragEvent) => { void dropGoal(event, column.id); }}
            class="min-h-[620px] border-gray-800 bg-gray-900/70 p-3 {dragOverStatus === column.id ? 'ring-2 ring-lime-400' : ''}"
          >
            <div class="mb-3 flex items-center gap-2 px-1"><span class="size-2 rounded-full" style={`background:${column.color}`}></span><strong class="text-xs uppercase tracking-wider text-gray-300">{column.label}</strong><Badge class="ml-auto" color="gray">{filtered.filter(g => g.status === column.id).length}</Badge></div>
            <div class="space-y-2.5">
              {#each filtered.filter(g => g.status === column.id) as goal}
                <Card
                  draggable={!savingIds.has(goal.id)}
                  ondragstart={(event: DragEvent) => startDrag(event, goal)}
                  ondragend={() => { draggedId = null; dragOverStatus = null; }}
                  class="cursor-grab border-gray-700 bg-gray-800 p-3 hover:border-gray-600 {draggedId === goal.id ? 'opacity-35' : ''} {savingIds.has(goal.id) ? 'pointer-events-none opacity-60' : ''}"
                >
                  <div class="mb-2 flex items-center gap-2"><GripVertical size={14} class="text-gray-600"/><Badge color={badgeColor[goal.priority]}>{goal.priority}</Badge><Button class="ml-auto" size="xs" color="dark" aria-label={`Удалить цель: ${goal.title}`} title="Удалить цель" onclick={() => { goalToDelete = goal; showDelete = true; }}><Trash2 size={13}/></Button></div>
                  <h3 class="text-sm font-semibold leading-snug">{goal.title}</h3>
                  <div class="mt-3 flex items-center justify-between"><span class="flex items-center gap-1.5 text-[10px] text-gray-500"><Command size={11}/>{savingIds.has(goal.id) ? 'Сохраняем...' : goal.area}</span><ButtonGroup><Button size="xs" color="dark" disabled={goal.status === 'backlog' || savingIds.has(goal.id)} onclick={() => move(goal, -1)} aria-label="Переместить назад"><ArrowLeft size={12}/></Button><Button size="xs" color="dark" disabled={goal.status === 'done' || savingIds.has(goal.id)} onclick={() => move(goal, 1)} aria-label="Переместить вперед"><ArrowRight size={12}/></Button></ButtonGroup></div>
                </Card>
              {/each}
              <Button outline color="dark" class="w-full border-dashed border-gray-700" onclick={() => showCreate = true}><Plus size={14}/> Добавить цель</Button>
            </div>
          </Card>
        {/each}
      </div>
      {/if}
    </div>
  </main>
</div>

<Modal bind:open={showCreate} title="Новая цель" size="md" class="border border-gray-700 bg-gray-900 text-white" headerClass="border-b border-gray-700 bg-gray-900 text-white" bodyClass="bg-gray-900" closeBtnClass="text-gray-400 hover:bg-gray-800">
  <form onsubmit={(event) => { event.preventDefault(); createGoal(); }}>
    <p class="mb-5 text-sm text-gray-500">Новая задача появится в запланированных.</p>
    <label class="block text-sm text-gray-400">Название<Input bind:value={newTitle} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="Например, проверить авторизацию"/></label>
    <label class="mt-4 block text-sm text-gray-400">Пространство<Select bind:value={newArea} items={areaOptions} class="mt-2 border-gray-700 bg-gray-800 text-white"/></label>
    <label class="mt-4 block text-sm text-gray-400">Приоритет<Select bind:value={newPriority} items={createPriorityOptions} class="mt-2 border-gray-700 bg-gray-800 text-white"/></label>
    <div class="mt-4 rounded-lg border border-gray-700 bg-gray-800/60 p-3">
      <div class="text-sm text-gray-400">Добавить пространство</div>
      <div class="mt-2 flex gap-2">
        <Input bind:value={customSpace} class="border-gray-700 bg-gray-900 text-white" placeholder="Например, Здоровье"/>
        <Button type="button" color="dark" onclick={addSpace}><Plus size={15}/> Добавить</Button>
      </div>
    </div>
    <Button type="submit" color="green" class="mt-5 w-full justify-center"><Plus size={16}/> Создать цель</Button>
  </form>
</Modal>

<Modal bind:open={showDelete} title="Удалить цель?" size="sm" class="border border-gray-700 bg-gray-900 text-white" headerClass="border-b border-gray-700 bg-gray-900 text-white" bodyClass="bg-gray-900" closeBtnClass="text-gray-400 hover:bg-gray-800">
  <div class="text-center">
    <div class="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-red-950 text-red-400"><Trash2 size={22}/></div>
    <p class="text-sm text-gray-400">Цель будет удалена без возможности восстановления.</p>
    {#if goalToDelete}<p class="mt-3 font-semibold">{goalToDelete.title}</p>{/if}
    <div class="mt-6 flex justify-center gap-3">
      <Button color="dark" onclick={() => { goalToDelete = null; showDelete = false; }} disabled={deleting}>Отмена</Button>
      <Button color="red" onclick={deleteGoal} disabled={deleting}><Trash2 size={15}/> {deleting ? 'Удаляем...' : 'Удалить'}</Button>
    </div>
  </div>
</Modal>
