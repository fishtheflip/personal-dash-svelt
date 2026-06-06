<script lang="ts">
  import { browser } from '$app/environment';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { Badge, Button, ButtonGroup, Card, Sidebar, SidebarGroup, SidebarItem } from 'flowbite-svelte';
  import {
    CalendarDays, CircleDot, CloudRain, Coffee, Link, Music2, Pause, Play,
    RotateCcw, TimerReset, Volume2, VolumeX, Waves, Zap
  } from '@lucide/svelte';
  import {
    playAmbience, setAmbienceVolume, stopAmbience, type AmbienceSound
  } from '$lib/ambience';

  type Mode = 'focus' | 'break';

  interface TimerState {
    mode: Mode;
    running: boolean;
    remaining: number;
    endAt: number | null;
    focusMinutes: number;
    breakMinutes: number;
    completed: number;
    ambience: AmbienceSound;
    ambiencePlaying: boolean;
    ambienceVolume: number;
    autoPlayAmbience: boolean;
  }

  const storageKey = 'personal-dash-pomodoro';
  const defaultState: TimerState = {
    mode: 'focus',
    running: false,
    remaining: 25 * 60,
    endAt: null,
    focusMinutes: 25,
    breakMinutes: 5,
    completed: 0,
    ambience: 'lofi',
    ambiencePlaying: false,
    ambienceVolume: 0.2,
    autoPlayAmbience: true
  };

  let timer = $state<TimerState>({ ...defaultState });
  let ready = $state(false);

  let totalSeconds = $derived((timer.mode === 'focus' ? timer.focusMinutes : timer.breakMinutes) * 60);
  let progress = $derived(Math.max(0, Math.min(1, 1 - timer.remaining / totalSeconds)));
  let dashOffset = $derived(565.49 * (1 - progress));
  let timeLabel = $derived(`${String(Math.floor(timer.remaining / 60)).padStart(2, '0')}:${String(timer.remaining % 60).padStart(2, '0')}`);

  onMount(() => {
    timer = loadState();
    timer.ambiencePlaying = false;
    ready = true;
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(interval);
      stopAmbience();
    };
  });

  function loadState(): TimerState {
    if (!browser) return { ...defaultState };
    try {
      return { ...defaultState, ...JSON.parse(localStorage.getItem(storageKey) ?? '{}') };
    } catch {
      return { ...defaultState };
    }
  }

  function saveState() {
    if (browser) localStorage.setItem(storageKey, JSON.stringify(timer));
  }

  function tick() {
    if (!timer.running || !timer.endAt) return;
    const next = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
    timer.remaining = next;
    if (next === 0) completeSession();
  }

  function start() {
    if (timer.remaining <= 0) timer.remaining = totalSeconds;
    timer.running = true;
    timer.endAt = Date.now() + timer.remaining * 1000;
    saveState();
    if (timer.mode === 'focus' && timer.autoPlayAmbience && !timer.ambiencePlaying) void toggleAmbience();
  }

  function pause() {
    tick();
    timer.running = false;
    timer.endAt = null;
    saveState();
  }

  function reset() {
    timer.running = false;
    timer.endAt = null;
    timer.remaining = totalSeconds;
    saveState();
  }

  function setMode(mode: Mode) {
    timer.mode = mode;
    timer.running = false;
    timer.endAt = null;
    timer.remaining = (mode === 'focus' ? timer.focusMinutes : timer.breakMinutes) * 60;
    saveState();
  }

  function setPreset(focusMinutes: number, breakMinutes: number) {
    timer.focusMinutes = focusMinutes;
    timer.breakMinutes = breakMinutes;
    timer.running = false;
    timer.endAt = null;
    timer.remaining = (timer.mode === 'focus' ? focusMinutes : breakMinutes) * 60;
    saveState();
  }

  function completeSession() {
    if (timer.mode === 'focus') timer.completed += 1;
    timer.mode = timer.mode === 'focus' ? 'break' : 'focus';
    timer.running = false;
    timer.endAt = null;
    timer.remaining = (timer.mode === 'focus' ? timer.focusMinutes : timer.breakMinutes) * 60;
    if (timer.ambiencePlaying) {
      stopAmbience();
      timer.ambiencePlaying = false;
    }
    saveState();
  }

  async function toggleAmbience() {
    if (timer.ambiencePlaying) {
      stopAmbience();
      timer.ambiencePlaying = false;
    } else {
      await playAmbience(timer.ambience, timer.ambienceVolume);
      timer.ambiencePlaying = true;
    }
    saveState();
  }

  async function selectAmbience(sound: AmbienceSound) {
    timer.ambience = sound;
    if (timer.ambiencePlaying) await playAmbience(sound, timer.ambienceVolume);
    saveState();
  }

  function changeVolume(event: Event) {
    timer.ambienceVolume = Number((event.currentTarget as HTMLInputElement).value);
    setAmbienceVolume(timer.ambienceVolume);
    saveState();
  }

  function toggleAutoPlay() {
    timer.autoPlayAmbience = !timer.autoPlayAmbience;
    saveState();
  }
</script>

<svelte:head><title>{ready ? `${timeLabel} — Pomodoro` : 'Pomodoro'}</title></svelte:head>

<div class="min-h-screen bg-gray-950 text-white">
  <Sidebar alwaysOpen class="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-gray-800 bg-gray-900 lg:block" divClass="h-full overflow-y-auto bg-gray-900 px-3 py-4" activeClass="bg-lime-400/15 text-lime-300" nonActiveClass="text-gray-400 hover:bg-gray-800 hover:text-white">
    <SidebarGroup class="mt-16">
      <SidebarItem href={`${base}/kanban`} label="Канбан">
        {#snippet icon()}<CircleDot size={17}/>{/snippet}
      </SidebarItem>
      <SidebarItem href={`${base}/calendar`} label="Календарь">
        {#snippet icon()}<CalendarDays size={17}/>{/snippet}
      </SidebarItem>
      <SidebarItem href={`${base}/links`} label="Ссылки">
        {#snippet icon()}<Link size={17}/>{/snippet}
      </SidebarItem>
      <SidebarItem href={`${base}/pomodoro`} label="Pomodoro" active>
        {#snippet icon()}<TimerReset size={17}/>{/snippet}
        {#snippet subtext()}<Badge color="green">{timer.completed}</Badge>{/snippet}
      </SidebarItem>
    </SidebarGroup>
  </Sidebar>

  <main class="lg:ml-64">
    <div class="mx-auto max-w-5xl p-5 lg:p-8">
      <div class="mb-8">
        <div class="mb-2 flex items-center gap-2 text-xs font-medium text-lime-400"><Zap size={14}/> Глубокая работа</div>
        <h1 class="text-4xl font-bold tracking-tight">Pomodoro</h1>
        <p class="mt-2 text-sm text-gray-500">Один таймер, одна задача, никаких лишних переключений.</p>
      </div>

      <div class="grid gap-5 lg:grid-cols-[1fr_300px]">
        <Card class="max-w-none border-gray-800 bg-gray-900 p-6 md:p-10">
          <div class="mb-8 flex justify-center">
            <ButtonGroup>
              <Button color={timer.mode === 'focus' ? 'green' : 'dark'} onclick={() => setMode('focus')}><Zap size={15}/> Фокус</Button>
              <Button color={timer.mode === 'break' ? 'green' : 'dark'} onclick={() => setMode('break')}><Coffee size={15}/> Перерыв</Button>
            </ButtonGroup>
          </div>

          <div class="relative mx-auto grid size-72 place-items-center md:size-80">
            <svg class="absolute inset-0 size-full -rotate-90" viewBox="0 0 200 200" aria-hidden="true">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#1f2937" stroke-width="8"/>
              <circle cx="100" cy="100" r="90" fill="none" stroke={timer.mode === 'focus' ? '#a3e635' : '#38bdf8'} stroke-width="8" stroke-linecap="round" stroke-dasharray="565.49" stroke-dashoffset={dashOffset} class="transition-all duration-500"/>
            </svg>
            <div class="relative text-center">
              <div class="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">{timer.mode === 'focus' ? 'Фокус' : 'Перерыв'}</div>
              <div class="mt-2 font-mono text-6xl font-bold tracking-tight md:text-7xl">{timeLabel}</div>
              <div class="mt-3 text-xs text-gray-500">{timer.running ? 'Сессия идёт' : 'Таймер на паузе'}</div>
            </div>
          </div>

          <div class="mt-9 flex justify-center gap-3">
            <Button color="dark" size="lg" onclick={reset} aria-label="Сбросить таймер"><RotateCcw size={18}/></Button>
            {#if timer.running}
              <Button color="green" size="lg" class="min-w-40 justify-center" onclick={pause}><Pause size={18}/> Пауза</Button>
            {:else}
              <Button color="green" size="lg" class="min-w-40 justify-center" onclick={start}><Play size={18}/> Начать</Button>
            {/if}
          </div>
        </Card>

        <div class="space-y-5">
          <Card class="max-w-none border-gray-800 bg-gray-900 p-5">
            <div class="text-xs uppercase tracking-wide text-gray-500">Сегодня завершено</div>
            <div class="mt-2 text-4xl font-bold text-lime-400">{timer.completed}</div>
            <p class="mt-2 text-xs leading-relaxed text-gray-500">Фокус-сессий. Счётчик хранится в этом браузере.</p>
          </Card>

          <Card class="max-w-none border-gray-800 bg-gray-900 p-5">
            <h2 class="font-semibold">Продолжительность</h2>
            <p class="mt-1 text-xs text-gray-500">Выбор пресета сбрасывает текущий таймер.</p>
            <div class="mt-4 grid gap-2">
              <Button color={timer.focusMinutes === 25 ? 'green' : 'dark'} class="w-full justify-between" onclick={() => setPreset(25, 5)}><span>Классический</span><span>25 / 5</span></Button>
              <Button color={timer.focusMinutes === 50 ? 'green' : 'dark'} class="w-full justify-between" onclick={() => setPreset(50, 10)}><span>Глубокий фокус</span><span>50 / 10</span></Button>
            </div>
          </Card>

          <Card class="max-w-none border-gray-800 bg-gray-900 p-5">
            <h2 class="font-semibold">Простой ритм</h2>
            <div class="mt-4 space-y-3 text-sm text-gray-400">
              <div class="flex gap-3"><span class="grid size-6 shrink-0 place-items-center rounded-full bg-lime-400/15 text-xs text-lime-300">1</span><span>Выбери одну конкретную задачу.</span></div>
              <div class="flex gap-3"><span class="grid size-6 shrink-0 place-items-center rounded-full bg-lime-400/15 text-xs text-lime-300">2</span><span>Работай до сигнала без переключений.</span></div>
              <div class="flex gap-3"><span class="grid size-6 shrink-0 place-items-center rounded-full bg-lime-400/15 text-xs text-lime-300">3</span><span>На перерыве действительно отдохни.</span></div>
            </div>
          </Card>
        </div>
      </div>

      <Card class="mt-5 max-w-none border-gray-800 bg-gray-900 p-5">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div><div class="flex items-center gap-2 font-semibold"><Music2 size={17} class="text-lime-400"/> Звуковая атмосфера</div><p class="mt-1 text-xs text-gray-500">Процедурный звук без рекламы, потоков и авторских ограничений.</p></div>
          <Button color={timer.ambiencePlaying ? 'green' : 'dark'} onclick={toggleAmbience}>
            {#if timer.ambiencePlaying}<VolumeX size={16}/> Выключить{:else}<Volume2 size={16}/> Включить{/if}
          </Button>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-3">
          <Button color={timer.ambience === 'lofi' ? 'green' : 'dark'} class="justify-start" onclick={() => selectAmbience('lofi')}><Music2 size={16}/> Lo-fi аккорд</Button>
          <Button color={timer.ambience === 'rain' ? 'green' : 'dark'} class="justify-start" onclick={() => selectAmbience('rain')}><CloudRain size={16}/> Дождь</Button>
          <Button color={timer.ambience === 'brown' ? 'green' : 'dark'} class="justify-start" onclick={() => selectAmbience('brown')}><Waves size={16}/> Глубокий шум</Button>
        </div>

        <div class="mt-5 grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <label class="block text-xs text-gray-400">
            <span class="mb-2 flex items-center justify-between"><span>Громкость</span><span>{Math.round(timer.ambienceVolume * 100)}%</span></span>
            <input aria-label="Громкость атмосферы" type="range" min="0.02" max="0.5" step="0.01" value={timer.ambienceVolume} oninput={changeVolume} class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-lime-400"/>
          </label>
          <Button color={timer.autoPlayAmbience ? 'green' : 'dark'} outline={!timer.autoPlayAmbience} onclick={toggleAutoPlay}>
            Автостарт: {timer.autoPlayAmbience ? 'включён' : 'выключен'}
          </Button>
        </div>
      </Card>
    </div>
  </main>
</div>
