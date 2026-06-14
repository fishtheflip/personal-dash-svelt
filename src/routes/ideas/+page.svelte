<script lang="ts">
  import { onMount } from 'svelte';
  import { Badge, Button, Card, Input, Modal, Select, Textarea } from 'flowbite-svelte';
  import { Check, CircleDot, Lightbulb, Link2, ListPlus, Plus, Search, Shapes, Trash2 } from '@lucide/svelte';
  import AppNavigation from '$lib/AppNavigation.svelte';
  import {
    createGoal, createIdea, createIdeaType, createIdeaTypes, deleteIdea, deleteIdeaType, getGoals, getIdeaGoalLinks,
    getIdeas, getIdeaTypes, getSpaces, setIdeaGoalLink
  } from '$lib/data';
  import type { Goal, Idea, IdeaGoalLink, IdeaType, Priority, Status } from '$lib/types';

  const defaultTypeNames = ['Продукт', 'Разработка', 'Контент', 'Личное'];

  let ideas = $state<Idea[]>([]);
  let types = $state<IdeaType[]>([]);
  let goals = $state<Goal[]>([]);
  let spaces = $state<string[]>([]);
  let ideaGoalLinks = $state<IdeaGoalLink[]>([]);
  let loading = $state(true);
  let errorMessage = $state('');
  let query = $state('');
  let selectedType = $state('all');
  let showCreate = $state(false);
  let showTypes = $state(false);
  let title = $state('');
  let description = $state('');
  let ideaTypeId = $state('');
  let newTypeName = $state('');
  let selectedIdea = $state<Idea | null>(null);
  let showGoals = $state(false);
  let goalQuery = $state('');
  let savingGoalIds = $state<Set<Goal['id']>>(new Set());
  let showCreateGoal = $state(false);
  let goalTitle = $state('');
  let goalArea = $state('');
  let goalPriority = $state<Priority>('medium');
  let creatingGoal = $state(false);

  let typeOptions = $derived(types.map((type) => ({ name: type.name, value: String(type.id) })));
  let filterOptions = $derived([{ name: 'Все типы', value: 'all' }, ...typeOptions]);
  let spaceOptions = $derived(spaces.map((space) => ({ name: space, value: space })));
  const priorityOptions = [
    { name: 'Высокий', value: 'high' },
    { name: 'Средний', value: 'medium' },
    { name: 'Низкий', value: 'low' }
  ];
  let filteredIdeas = $derived(ideas.filter((idea) => {
    const type = typeName(idea.typeId);
    const matchesQuery = `${idea.title} ${idea.description} ${type}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (selectedType === 'all' || String(idea.typeId) === selectedType);
  }));

  onMount(loadData);

  async function loadData() {
    try {
      const [storedIdeas, storedTypes, storedGoals, storedSpaces] = await Promise.all([getIdeas(), getIdeaTypes(), getGoals(), getSpaces()]);
      ideas = storedIdeas;
      goals = storedGoals;
      spaces = storedSpaces.length ? storedSpaces : Array.from(new Set(storedGoals.map((goal) => goal.area)));
      types = storedTypes.length ? storedTypes : await createIdeaTypes(defaultTypeNames);
      ideaTypeId = types.length ? String(types[0].id) : '';
      try {
        ideaGoalLinks = await getIdeaGoalLinks();
      } catch (error) {
        errorMessage = ideasError(error);
      }
    } catch (error) {
      errorMessage = ideasError(error);
    } finally {
      loading = false;
    }
  }

  function ideasError(error: unknown) {
    const message = error instanceof Error ? error.message : '';
    return message.includes('idea_goal_links')
      ? 'Выполните миграцию supabase/migrations/202606140002_idea_goal_links.sql в Supabase SQL Editor.'
      : message.includes('idea_types') || message.includes('ideas')
      ? 'Выполните миграцию supabase/migrations/202606140001_ideas.sql в Supabase SQL Editor.'
      : message || 'Не удалось обработать идеи';
  }

  function typeName(typeId: Idea['typeId']) {
    return types.find((type) => String(type.id) === String(typeId))?.name ?? 'Без типа';
  }

  function linkedGoals(ideaId: Idea['id']) {
    const goalIds = new Set(ideaGoalLinks.filter((link) => String(link.ideaId) === String(ideaId)).map((link) => String(link.goalId)));
    return goals.filter((goal) => goalIds.has(String(goal.id)));
  }

  function isGoalLinked(ideaId: Idea['id'], goalId: Goal['id']) {
    return ideaGoalLinks.some((link) => String(link.ideaId) === String(ideaId) && String(link.goalId) === String(goalId));
  }

  function statusLabel(status: Status) {
    return { backlog: 'Запланировано', progress: 'В работе', done: 'Готово' }[status];
  }

  function openGoals(idea: Idea) {
    selectedIdea = idea;
    goalQuery = '';
    showGoals = true;
  }

  function openGoalCreation(idea: Idea) {
    selectedIdea = idea;
    goalTitle = idea.title;
    goalArea = spaces[0] ?? '';
    goalPriority = 'medium';
    showCreateGoal = true;
  }

  async function addGoalFromIdea() {
    if (!selectedIdea || !goalTitle.trim() || !goalArea || creatingGoal) return;
    creatingGoal = true;
    errorMessage = '';
    try {
      const created = await createGoal({
        title: goalTitle.trim(), area: goalArea, priority: goalPriority, status: 'backlog'
      });
      goals = [...goals, created];
      showCreateGoal = false;
      try {
        await setIdeaGoalLink(selectedIdea.id, created.id, true);
        ideaGoalLinks = [...ideaGoalLinks, { ideaId: selectedIdea.id, goalId: created.id }];
      } catch (error) {
        errorMessage = `Задача создана, но связь не сохранена. ${ideasError(error)}`;
      }
    } catch (error) {
      errorMessage = ideasError(error);
    } finally {
      creatingGoal = false;
    }
  }

  async function toggleGoal(goal: Goal) {
    if (!selectedIdea || savingGoalIds.has(goal.id)) return;
    const linked = !isGoalLinked(selectedIdea.id, goal.id);
    savingGoalIds = new Set([...savingGoalIds, goal.id]);
    errorMessage = '';
    try {
      await setIdeaGoalLink(selectedIdea.id, goal.id, linked);
      ideaGoalLinks = linked
        ? [...ideaGoalLinks, { ideaId: selectedIdea.id, goalId: goal.id }]
        : ideaGoalLinks.filter((link) => !(String(link.ideaId) === String(selectedIdea?.id) && String(link.goalId) === String(goal.id)));
    } catch (error) {
      errorMessage = ideasError(error);
    } finally {
      savingGoalIds = new Set([...savingGoalIds].filter((id) => id !== goal.id));
    }
  }

  function openCreate() {
    if (!ideaTypeId && types.length) ideaTypeId = String(types[0].id);
    showCreate = true;
  }

  async function addIdea() {
    if (!title.trim() || !ideaTypeId) return;
    errorMessage = '';
    try {
      const created = await createIdea({
        title: title.trim(), description: description.trim(), typeId: ideaTypeId
      });
      ideas = [created, ...ideas];
      title = '';
      description = '';
      showCreate = false;
    } catch (error) {
      errorMessage = ideasError(error);
    }
  }

  async function removeIdea(id: Idea['id']) {
    try {
      await deleteIdea(id);
      ideas = ideas.filter((idea) => idea.id !== id);
    } catch (error) {
      errorMessage = ideasError(error);
    }
  }

  async function addType() {
    const name = newTypeName.trim();
    if (!name) return;
    errorMessage = '';
    try {
      const created = await createIdeaType(name);
      types = [...types, created];
      ideaTypeId = String(created.id);
      newTypeName = '';
    } catch (error) {
      errorMessage = ideasError(error);
    }
  }

  async function removeType(type: IdeaType) {
    if (ideas.some((idea) => String(idea.typeId) === String(type.id))) {
      errorMessage = 'Сначала удалите идеи этого типа, затем можно удалить сам тип.';
      return;
    }
    try {
      await deleteIdeaType(type.id);
      types = types.filter((item) => item.id !== type.id);
      if (selectedType === String(type.id)) selectedType = 'all';
      if (ideaTypeId === String(type.id)) ideaTypeId = types.length ? String(types[0].id) : '';
    } catch (error) {
      errorMessage = ideasError(error);
    }
  }
</script>

<svelte:head><title>Идеи</title></svelte:head>

<div class="min-h-screen bg-gray-950 text-white">
  <AppNavigation active="ideas"/>

  <main class="lg:ml-64">
    <Card class="sticky top-0 z-20 w-full max-w-none rounded-none border-x-0 border-t-0 border-gray-800 bg-gray-950/95 p-3 backdrop-blur lg:px-8">
      <div class="flex flex-wrap items-center gap-3">
        <div class="min-w-56 flex-1 md:max-w-md">
          <Input bind:value={query} divClass="w-full" class="w-full border-gray-700 bg-gray-900 pl-11 text-white" leftClass="pointer-events-none w-10 justify-center text-gray-400" placeholder="Поиск идей...">
            {#snippet left()}<Search size={15}/>{/snippet}
          </Input>
        </div>
        <Select bind:value={selectedType} items={filterOptions} class="w-40 border-gray-700 bg-gray-900 text-white"/>
        <Button color="dark" onclick={() => showTypes = true}><Shapes size={16}/> Типы</Button>
        <Button color="green" onclick={openCreate} disabled={!types.length}><Plus size={16}/> Новая идея</Button>
      </div>
    </Card>

    <div class="p-5 lg:p-8">
      {#if errorMessage}<div class="mb-5 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{errorMessage}</div>{/if}

      <div class="mb-5 flex items-center gap-3"><h1 class="text-3xl font-bold tracking-tight">Идеи</h1><Badge color="gray">{filteredIdeas.length}</Badge></div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3 {loading ? 'opacity-50' : ''}">
        {#each filteredIdeas as idea}
          <Card class="max-w-none border-gray-800 bg-gray-900 p-3.5">
            <div class="flex items-start gap-2">
              <div class="min-w-0 flex-1">
                <div class="mb-2 flex items-center gap-2"><Badge color="green">{typeName(idea.typeId)}</Badge>{#if linkedGoals(idea.id).length}<span class="text-[11px] text-gray-500">{linkedGoals(idea.id).filter((goal) => goal.status === 'done').length}/{linkedGoals(idea.id).length} задач</span>{/if}</div>
                <h2 class="font-semibold leading-snug">{idea.title}</h2>
              </div>
              <Button color="dark" size="xs" onclick={() => removeIdea(idea.id)} aria-label={`Удалить идею: ${idea.title}`}><Trash2 size={13}/></Button>
            </div>
            {#if idea.description}<p class="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">{idea.description}</p>{/if}
            {#if linkedGoals(idea.id).length}
              <div class="mt-3 flex flex-wrap gap-1.5">
                {#each linkedGoals(idea.id).slice(0, 2) as goal}
                  <span class="max-w-full truncate rounded-md bg-gray-800 px-2 py-1 text-[11px] {goal.status === 'done' ? 'text-gray-600 line-through' : 'text-gray-400'}">{goal.title}</span>
                {/each}
                {#if linkedGoals(idea.id).length > 2}<span class="rounded-md bg-gray-800 px-2 py-1 text-[11px] text-gray-500">+{linkedGoals(idea.id).length - 2}</span>{/if}
              </div>
            {/if}
            <div class="mt-3 flex gap-2 border-t border-gray-800 pt-3">
              <Button color="green" size="xs" onclick={() => openGoalCreation(idea)}><ListPlus size={13}/> Создать задачу</Button>
              <Button color="dark" size="xs" onclick={() => openGoals(idea)}><Link2 size={13}/> Связать</Button>
            </div>
          </Card>
        {:else}
          <Card class="max-w-none border-dashed border-gray-700 bg-gray-900 p-12 text-center md:col-span-2 xl:col-span-3">
            <Lightbulb size={28} class="mx-auto mb-3 text-gray-600"/>
            <p class="text-gray-400">{loading ? 'Загрузка идей...' : 'Здесь пока пусто'}</p>
            {#if !loading && types.length}<Button color="green" class="mt-4" onclick={openCreate}><Plus size={15}/> Записать первую идею</Button>{/if}
          </Card>
        {/each}
      </div>
    </div>
  </main>
</div>

<Modal bind:open={showCreate} title="Новая идея" size="md" class="border border-gray-700 bg-gray-900 text-white" headerClass="border-b border-gray-700 bg-gray-900 text-white" bodyClass="bg-gray-900" closeBtnClass="text-gray-400 hover:bg-gray-800">
  <form onsubmit={(event) => { event.preventDefault(); addIdea(); }}>
    <label class="block text-sm text-gray-400">Название<Input bind:value={title} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="Что пришло в голову?"/></label>
    <label class="mt-4 block text-sm text-gray-400">Тип<Select bind:value={ideaTypeId} items={typeOptions} class="mt-2 border-gray-700 bg-gray-800 text-white"/></label>
    <label class="mt-4 block text-sm text-gray-400">Описание<Textarea bind:value={description} rows={5} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="Контекст, детали и возможный следующий шаг"/></label>
    <Button type="submit" color="green" class="mt-5 w-full justify-center"><Plus size={16}/> Добавить идею</Button>
  </form>
</Modal>

<Modal bind:open={showCreateGoal} title="Задача из идеи" size="md" class="border border-gray-700 bg-gray-900 text-white" headerClass="border-b border-gray-700 bg-gray-900 text-white" bodyClass="bg-gray-900" closeBtnClass="text-gray-400 hover:bg-gray-800">
  <form onsubmit={(event) => { event.preventDefault(); addGoalFromIdea(); }}>
    <label class="block text-sm text-gray-400">Название<Input bind:value={goalTitle} class="mt-2 border-gray-700 bg-gray-800 text-white"/></label>
    <label class="mt-4 block text-sm text-gray-400">Пространство<Select bind:value={goalArea} items={spaceOptions} class="mt-2 border-gray-700 bg-gray-800 text-white"/></label>
    <label class="mt-4 block text-sm text-gray-400">Приоритет<Select bind:value={goalPriority} items={priorityOptions} class="mt-2 border-gray-700 bg-gray-800 text-white"/></label>
    <Button type="submit" color="green" class="mt-5 w-full justify-center" disabled={creatingGoal || !goalArea}><ListPlus size={16}/> {creatingGoal ? 'Создаём...' : 'Создать и связать'}</Button>
  </form>
</Modal>

<Modal bind:open={showGoals} title="Связанные задачи" size="lg" class="border border-gray-700 bg-gray-900 text-white" headerClass="border-b border-gray-700 bg-gray-900 text-white" bodyClass="bg-gray-900" closeBtnClass="text-gray-400 hover:bg-gray-800">
  {#if selectedIdea}
    <p class="mb-4 truncate text-sm font-medium text-gray-300">{selectedIdea.title}</p>
    <Input bind:value={goalQuery} class="border-gray-700 bg-gray-800 text-white" placeholder="Поиск задач..."/>
    <div class="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
      {#each goals.filter((goal) => `${goal.title} ${goal.area}`.toLowerCase().includes(goalQuery.toLowerCase())) as goal}
        <button
          type="button"
          disabled={savingGoalIds.has(goal.id)}
          onclick={() => toggleGoal(goal)}
          class="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition {isGoalLinked(selectedIdea.id, goal.id) ? 'border-lime-400/50 bg-lime-400/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}"
        >
          <span class="grid size-6 shrink-0 place-items-center rounded-md border {isGoalLinked(selectedIdea.id, goal.id) ? 'border-lime-400 bg-lime-400 text-gray-950' : 'border-gray-600 text-transparent'}"><Check size={14}/></span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium">{goal.title}</span>
            <span class="mt-1 flex items-center gap-2 text-xs text-gray-500"><CircleDot size={11}/>{goal.area} · {statusLabel(goal.status)}</span>
          </span>
        </button>
      {:else}
        <p class="rounded-lg border border-dashed border-gray-700 p-7 text-center text-sm text-gray-500">Подходящих задач нет</p>
      {/each}
    </div>
  {/if}
</Modal>

<Modal bind:open={showTypes} title="Типы идей" size="md" class="border border-gray-700 bg-gray-900 text-white" headerClass="border-b border-gray-700 bg-gray-900 text-white" bodyClass="bg-gray-900" closeBtnClass="text-gray-400 hover:bg-gray-800">
  <form class="flex gap-2" onsubmit={(event) => { event.preventDefault(); addType(); }}>
    <Input bind:value={newTypeName} class="border-gray-700 bg-gray-800 text-white" placeholder="Новый тип идеи"/>
    <Button type="submit" color="green"><Plus size={15}/> Добавить</Button>
  </form>
  <div class="mt-5 space-y-2">
    {#each types as type}
      <div class="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 p-3">
        <Shapes size={15} class="text-lime-400"/>
        <span class="min-w-0 flex-1 truncate text-sm">{type.name}</span>
        <Badge color="gray">{ideas.filter((idea) => String(idea.typeId) === String(type.id)).length}</Badge>
        <Button color="red" outline size="xs" onclick={() => removeType(type)} aria-label={`Удалить тип: ${type.name}`}><Trash2 size={13}/></Button>
      </div>
    {:else}
      <p class="rounded-lg border border-dashed border-gray-700 p-6 text-center text-sm text-gray-500">Добавьте первый тип идей</p>
    {/each}
  </div>
</Modal>
