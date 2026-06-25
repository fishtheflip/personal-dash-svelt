<script lang="ts">
  import { ExternalLink } from '@lucide/svelte';
  import { Button } from 'flowbite-svelte';
  import AppNavigation from '$lib/AppNavigation.svelte';

  const dashboardUrl = 'https://fishtheflip.github.io/polymarket-ang/';
</script>

<svelte:head><title>Polymarket Dashboard</title></svelte:head>

<div class="min-h-screen bg-gray-950 text-white">
  <AppNavigation active="polymarket"/>

  <main class="flex min-h-screen flex-col lg:ml-64">
    <div class="flex h-14 shrink-0 items-center gap-3 border-b border-gray-800 bg-gray-950 px-4 lg:px-6">
      <h1 class="font-semibold">Polymarket Dashboard</h1>
      <Button href={dashboardUrl} target="_blank" rel="noreferrer" color="dark" size="xs" class="ml-auto">
        <ExternalLink size={14}/> Открыть отдельно
      </Button>
    </div>
    <iframe
      src={dashboardUrl}
      title="Polymarket Dashboard"
      class="min-h-[calc(100vh-7rem)] w-full flex-1 border-0 bg-white lg:min-h-[calc(100vh-3.5rem)]"
      loading="eager"
      allow="clipboard-read; clipboard-write"
    ></iframe>
  </main>
</div>
