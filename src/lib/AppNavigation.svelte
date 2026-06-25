<script lang="ts">
  import { base } from '$app/paths';
  import { Badge, Button, Sidebar, SidebarGroup, SidebarItem } from 'flowbite-svelte';
  import { BarChart3, CalendarDays, CircleDot, ClipboardCheck, Lightbulb, Link, Menu, TimerReset, UserRound, X } from '@lucide/svelte';

  let {
    active,
    kanbanCount,
    pomodoroCount
  }: {
    active: 'kanban' | 'calendar' | 'links' | 'contacts' | 'ideas' | 'polymarket' | 'pomodoro' | 'check-in';
    kanbanCount?: number;
    pomodoroCount?: number;
  } = $props();

  let mobileOpen = $state(false);

  function close() {
    mobileOpen = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') close();
  }
</script>

<svelte:window onkeydown={handleKeydown}/>

<div class="sticky top-0 z-40 flex h-14 items-center border-b border-gray-800 bg-gray-950/95 px-3 backdrop-blur lg:hidden">
  <Button color="dark" size="sm" onclick={() => mobileOpen = true} aria-label="Открыть навигацию"><Menu size={18}/></Button>
  <span class="ml-3 text-sm font-semibold">Личное пространство</span>
</div>

{#if mobileOpen}
  <button class="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden" onclick={close} aria-label="Закрыть навигацию"></button>
{/if}

<aside class="fixed inset-y-0 left-0 z-50 w-72 border-r border-gray-800 bg-gray-900 transition-transform duration-200 lg:z-30 lg:w-64 {mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}">
  <div class="flex h-14 items-center justify-between border-b border-gray-800 px-4 lg:hidden">
    <span class="text-sm font-semibold">Навигация</span>
    <Button color="dark" size="xs" onclick={close} aria-label="Закрыть навигацию"><X size={17}/></Button>
  </div>
  <Sidebar alwaysOpen class="h-full w-full bg-gray-900" divClass="h-full overflow-y-auto bg-gray-900 px-3 py-4" activeClass="bg-lime-400/15 text-lime-300" nonActiveClass="text-gray-400 hover:bg-gray-800 hover:text-white">
    <SidebarGroup class="lg:mt-12">
      <SidebarItem href={`${base}/kanban`} label="Канбан" active={active === 'kanban'} onclick={close}>
        {#snippet icon()}<CircleDot size={17}/>{/snippet}
        {#if kanbanCount !== undefined}{#snippet subtext()}<Badge color="green">{kanbanCount}</Badge>{/snippet}{/if}
      </SidebarItem>
      <SidebarItem href={`${base}/calendar`} label="Календарь" active={active === 'calendar'} onclick={close}>
        {#snippet icon()}<CalendarDays size={17}/>{/snippet}
      </SidebarItem>
      <SidebarItem href={`${base}/links`} label="Ссылки" active={active === 'links'} onclick={close}>
        {#snippet icon()}<Link size={17}/>{/snippet}
      </SidebarItem>
      <SidebarItem href={`${base}/contacts`} label="Контакты" active={active === 'contacts'} onclick={close}>
        {#snippet icon()}<UserRound size={17}/>{/snippet}
      </SidebarItem>
      <SidebarItem href={`${base}/ideas`} label="Идеи" active={active === 'ideas'} onclick={close}>
        {#snippet icon()}<Lightbulb size={17}/>{/snippet}
      </SidebarItem>
      <SidebarItem href={`${base}/pomodoro`} label="Pomodoro" active={active === 'pomodoro'} onclick={close}>
        {#snippet icon()}<TimerReset size={17}/>{/snippet}
        {#if pomodoroCount !== undefined}{#snippet subtext()}<Badge color="green">{pomodoroCount}</Badge>{/snippet}{/if}
      </SidebarItem>
      <SidebarItem href={`${base}/check-in`} label="Чек-ин" active={active === 'check-in'} onclick={close}>
        {#snippet icon()}<ClipboardCheck size={17}/>{/snippet}
      </SidebarItem>
    </SidebarGroup>
    <SidebarGroup border borderClass="mt-5 border-t border-gray-800 pt-4">
      <SidebarItem
        href={`${base}/polymarket`}
        label="Polymarket"
        active={active === 'polymarket'}
        activeClass="flex items-center border-l-2 border-blue-400 bg-blue-500/10 p-2 text-base font-normal text-blue-300"
        nonActiveClass="flex items-center border-l-2 border-transparent p-2 text-base font-normal text-gray-400 hover:border-blue-500/50 hover:bg-gray-800 hover:text-blue-300"
        aClass="rounded-r-lg rounded-l-sm"
        onclick={close}
      >
        {#snippet icon()}<BarChart3 size={17} class="text-blue-400"/>{/snippet}
      </SidebarItem>
    </SidebarGroup>
  </Sidebar>
</aside>
