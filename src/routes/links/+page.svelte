<script lang="ts">
  import { browser } from '$app/environment';
  import {
    Badge, Button, Card, Input, Modal, Select, Sidebar, SidebarGroup, SidebarItem,
    Textarea
  } from 'flowbite-svelte';
  import {
    CalendarDays, CircleDot, ExternalLink, Link, Plus, Search, Trash2
  } from '@lucide/svelte';

  interface UsefulLink {
    id: number;
    title: string;
    url: string;
    category: string;
    note: string;
  }

  const storageKey = 'goal-planner-useful-links';
  const categories = ['Все', 'DP', 'QA', 'Docs', 'Tools', 'Learning'];
  const categoryOptions = categories.slice(1).map((item) => ({ name: item, value: item }));
  const defaultLinks: UsefulLink[] = [
    { id: 1, title: 'DP Test Web', url: 'https://example.com', category: 'DP', note: 'Заменить на реальную ссылку окружения.' },
    { id: 2, title: 'Lighthouse', url: 'https://developer.chrome.com/docs/lighthouse', category: 'Tools', note: 'Проверка performance, accessibility, SEO.' },
    { id: 3, title: 'Svelte Docs', url: 'https://svelte.dev/docs', category: 'Docs', note: 'Документация по Svelte и SvelteKit.' }
  ];

  let links = $state<UsefulLink[]>(loadLinks());
  let query = $state('');
  let category = $state('Все');
  let showCreate = $state(false);
  let title = $state('');
  let url = $state('');
  let linkCategory = $state('DP');
  let note = $state('');

  let filtered = $derived(links.filter((item) =>
    `${item.title} ${item.url} ${item.category} ${item.note}`.toLowerCase().includes(query.toLowerCase())
    && (category === 'Все' || item.category === category)
  ));

  function loadLinks(): UsefulLink[] {
    if (!browser) return defaultLinks;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) as UsefulLink[] : defaultLinks;
    } catch {
      return defaultLinks;
    }
  }

  function saveLinks() {
    if (browser) localStorage.setItem(storageKey, JSON.stringify(links));
  }

  function normalizeUrl(value: string) {
    if (!value.trim()) return '';
    return /^https?:\/\//.test(value) ? value : `https://${value}`;
  }

  function addLink() {
    const normalized = normalizeUrl(url);
    if (!title.trim() || !normalized) return;
    links = [...links, {
      id: Date.now(), title: title.trim(), url: normalized, category: linkCategory, note: note.trim()
    }];
    saveLinks();
    title = '';
    url = '';
    note = '';
    showCreate = false;
  }

  function deleteLink(id: number) {
    links = links.filter((item) => item.id !== id);
    saveLinks();
  }
</script>

<svelte:head><title>Полезные ссылки</title></svelte:head>

<div class="min-h-screen bg-gray-950 text-white">
  <Sidebar alwaysOpen class="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-gray-800 bg-gray-900 lg:block" divClass="h-full overflow-y-auto bg-gray-900 px-3 py-4" activeClass="bg-lime-400/15 text-lime-300" nonActiveClass="text-gray-400 hover:bg-gray-800 hover:text-white">
    <SidebarGroup class="mt-16">
      <SidebarItem href="/kanban" label="Канбан">
        {#snippet icon()}<CircleDot size={17}/>{/snippet}
      </SidebarItem>
      <SidebarItem href="/calendar" label="Календарь">
        {#snippet icon()}<CalendarDays size={17}/>{/snippet}
      </SidebarItem>
      <SidebarItem href="/links" label="Ссылки" active>
        {#snippet icon()}<Link size={17}/>{/snippet}
      </SidebarItem>
    </SidebarGroup>
  </Sidebar>

  <main class="lg:ml-64">
    <Card class="sticky top-0 z-20 w-full max-w-none rounded-none border-x-0 border-t-0 border-gray-800 bg-gray-950/95 p-3 backdrop-blur lg:px-8">
      <div class="flex items-center gap-3">
        <div class="w-full max-w-md"><Input bind:value={query} divClass="w-full" class="w-full border-gray-700 bg-gray-900 text-white" placeholder="Поиск ссылок...">{#snippet left()}<Search size={15}/>{/snippet}</Input></div>
        <Button color="green" class="ml-auto" onclick={() => showCreate = true}><Plus size={16}/> Новая ссылка</Button>
      </div>
    </Card>

    <div class="p-5 lg:p-8">
      <div class="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><div class="mb-2 flex items-center gap-2 text-xs font-medium text-lime-400"><Link size={14}/> Быстрый доступ</div><h1 class="text-4xl font-bold tracking-tight">Полезные ссылки</h1><p class="mt-2 text-sm text-gray-500">Окружения, документация, QA-инструменты и материалы.</p></div>
        <Select bind:value={category} items={categories.map((item) => ({ name: item, value: item }))} class="w-48 border-gray-700 bg-gray-900 text-white"/>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {#each filtered as item}
          <Card class="max-w-none border-gray-800 bg-gray-900 p-4">
            <div class="mb-3 flex items-start gap-3">
              <div class="grid size-10 place-items-center rounded-lg bg-gray-800 text-lime-400"><Link size={18}/></div>
              <div class="min-w-0 flex-1"><h2 class="truncate font-semibold">{item.title}</h2><a class="mt-1 block truncate text-xs text-blue-400 hover:underline" href={item.url} target="_blank" rel="noreferrer">{item.url}</a></div>
              <Button color="red" outline size="xs" onclick={() => deleteLink(item.id)} aria-label="Удалить ссылку"><Trash2 size={13}/></Button>
            </div>
            <div class="mb-4 flex items-center gap-2"><Badge color="green">{item.category}</Badge></div>
            {#if item.note}<p class="mb-4 text-sm leading-relaxed text-gray-400">{item.note}</p>{/if}
            <Button href={item.url} target="_blank" color="dark" class="w-full justify-center"><ExternalLink size={15}/> Открыть</Button>
          </Card>
        {:else}
          <Card class="max-w-none border-dashed border-gray-700 bg-gray-900 p-10 text-center md:col-span-2 xl:col-span-3">
            <p class="text-gray-500">Ссылок по этому фильтру нет</p>
          </Card>
        {/each}
      </div>
    </div>
  </main>
</div>

<Modal bind:open={showCreate} title="Новая ссылка" size="md" class="border border-gray-700 bg-gray-900 text-white" headerClass="border-b border-gray-700 bg-gray-900 text-white" bodyClass="bg-gray-900" closeBtnClass="text-gray-400 hover:bg-gray-800">
  <form onsubmit={(event) => { event.preventDefault(); addLink(); }}>
    <label class="block text-sm text-gray-400">Название<Input bind:value={title} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="Например, DP staging"/></label>
    <label class="mt-4 block text-sm text-gray-400">URL<Input bind:value={url} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="https://..."/></label>
    <label class="mt-4 block text-sm text-gray-400">Категория<Select bind:value={linkCategory} items={categoryOptions} class="mt-2 border-gray-700 bg-gray-800 text-white"/></label>
    <label class="mt-4 block text-sm text-gray-400">Заметка<Textarea bind:value={note} rows={3} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="Для чего эта ссылка?"/></label>
    <Button type="submit" color="green" class="mt-5 w-full justify-center"><Plus size={16}/> Добавить ссылку</Button>
  </form>
</Modal>
