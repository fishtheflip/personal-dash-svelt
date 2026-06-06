<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, Card, Input } from 'flowbite-svelte';
  import { Database, LogIn, LogOut } from '@lucide/svelte';
  import type { Session } from '@supabase/supabase-js';
  import { isSupabaseConfigured, supabase } from '$lib/supabase';

  let { children } = $props();
  let session = $state<Session | null>(null);
  let loading = $state(true);
  let submitting = $state(false);
  let email = $state('');
  let password = $state('');
  let message = $state('');

  onMount(() => {
    if (!supabase) {
      loading = false;
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      session = data.session;
      loading = false;
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      session = nextSession;
      loading = false;
    });

    return () => data.subscription.unsubscribe();
  });

  async function signIn() {
    if (!supabase || !email.trim() || !password) return;
    submitting = true;
    message = '';
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    message = error ? error.message : '';
    submitting = false;
  }

  async function signOut() {
    await supabase?.auth.signOut();
  }
</script>

{#if loading}
  <div class="grid min-h-screen place-items-center bg-gray-950 text-sm text-gray-400">Подключение к базе данных...</div>
{:else if !isSupabaseConfigured}
  <div class="grid min-h-screen place-items-center bg-gray-950 p-5 text-white">
    <Card class="max-w-lg border-gray-800 bg-gray-900 p-7 text-center">
      <Database class="mx-auto mb-4 text-lime-400" size={30}/>
      <h1 class="text-xl font-bold">Подключите Supabase</h1>
      <p class="mt-3 text-sm leading-relaxed text-gray-400">Создайте <code>.env</code> по примеру <code>.env.example</code>, затем перезапустите dev-сервер. Полная инструкция находится в <code>SUPABASE_SETUP.md</code>.</p>
    </Card>
  </div>
{:else if !session}
  <div class="grid min-h-screen place-items-center bg-gray-950 p-5 text-white">
    <Card class="w-full max-w-md border-gray-800 bg-gray-900 p-7">
      <div class="mb-6"><div class="mb-2 flex items-center gap-2 text-xs font-medium text-lime-400"><Database size={14}/> Личное пространство</div><h1 class="text-2xl font-bold">Вход</h1><p class="mt-2 text-sm text-gray-500">Доступ к данным защищён Supabase Auth.</p></div>
      <form onsubmit={(event) => { event.preventDefault(); signIn(); }}>
        <label class="block text-sm text-gray-400">Email<Input type="email" bind:value={email} class="mt-2 border-gray-700 bg-gray-800 text-white" autocomplete="email"/></label>
        <label class="mt-4 block text-sm text-gray-400">Пароль<Input type="password" bind:value={password} class="mt-2 border-gray-700 bg-gray-800 text-white" autocomplete="current-password"/></label>
        {#if message}<p class="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-xs text-red-300">{message}</p>{/if}
        <Button type="submit" color="green" class="mt-5 w-full justify-center" disabled={submitting}><LogIn size={16}/> {submitting ? 'Входим...' : 'Войти'}</Button>
      </form>
    </Card>
  </div>
{:else}
  {@render children()}
  <Button color="dark" size="xs" class="fixed bottom-4 left-4 z-50 hidden border-gray-700 lg:flex" onclick={signOut} title={session.user.email ?? 'Выйти'}>
    <LogOut size={14}/> Выйти
  </Button>
{/if}
