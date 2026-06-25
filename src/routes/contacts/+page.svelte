<script lang="ts">
  import { onMount } from 'svelte';
  import { Badge, Button, Card, Input, Modal, Textarea } from 'flowbite-svelte';
  import {
    AtSign, ExternalLink, Linkedin, MessageCircle, Phone, Plus, Search, Trash2, UserRound
  } from '@lucide/svelte';
  import AppNavigation from '$lib/AppNavigation.svelte';
  import { createContact, deleteContact, getContacts } from '$lib/data';
  import type { Contact } from '$lib/types';

  let contacts = $state<Contact[]>([]);
  let loading = $state(true);
  let errorMessage = $state('');
  let query = $state('');
  let showCreate = $state(false);
  let name = $state('');
  let phone = $state('');
  let telegram = $state('');
  let linkedin = $state('');
  let social = $state('');
  let note = $state('');
  let comments = $state('');

  let filtered = $derived(contacts.filter((contact) =>
    `${contact.name} ${contact.phone} ${contact.telegram} ${contact.linkedin} ${contact.social} ${contact.note} ${contact.comments}`
      .toLowerCase()
      .includes(query.toLowerCase())
  ));

  onMount(loadContacts);

  async function loadContacts() {
    try {
      contacts = await getContacts();
    } catch (error) {
      errorMessage = contactError(error);
    } finally {
      loading = false;
    }
  }

  function contactError(error: unknown) {
    const message = error instanceof Error ? error.message : '';
    return message.includes('contacts')
      ? 'Выполните миграции контактов из supabase/migrations в Supabase SQL Editor.'
      : message || 'Не удалось обработать контакты';
  }

  function normalizeTelegram(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//.test(trimmed)) return trimmed;
    const username = trimmed.replace(/^@/, '').replace(/^t\.me\//, '');
    return username ? `https://t.me/${username}` : '';
  }

  function normalizeLinkedin(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//.test(trimmed)) return trimmed;
    return `https://www.linkedin.com/in/${trimmed.replace(/^\/+|\/+$/g, '')}`;
  }

  function normalizeSocial(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return '';
    return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

  function displayHandle(url: string, fallback: string) {
    if (!url) return fallback;
    return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  }

  async function addContact() {
    if (!name.trim()) return;
    errorMessage = '';
    try {
      const created = await createContact({
        name: name.trim(),
        phone: phone.trim(),
        telegram: normalizeTelegram(telegram),
        linkedin: normalizeLinkedin(linkedin),
        social: normalizeSocial(social),
        note: note.trim(),
        comments: comments.trim()
      });
      contacts = [created, ...contacts];
      name = '';
      phone = '';
      telegram = '';
      linkedin = '';
      social = '';
      note = '';
      comments = '';
      showCreate = false;
    } catch (error) {
      errorMessage = contactError(error);
    }
  }

  async function removeContact(id: Contact['id']) {
    try {
      await deleteContact(id);
      contacts = contacts.filter((contact) => contact.id !== id);
    } catch (error) {
      errorMessage = contactError(error);
    }
  }
</script>

<svelte:head><title>Контакты</title></svelte:head>

<div class="min-h-screen bg-gray-950 text-white">
  <AppNavigation active="contacts"/>

  <main class="lg:ml-64">
    <Card class="sticky top-0 z-20 w-full max-w-none rounded-none border-x-0 border-t-0 border-gray-800 bg-gray-950/95 p-3 backdrop-blur lg:px-8">
      <div class="flex flex-wrap items-center gap-3">
        <div class="min-w-56 flex-1 md:max-w-md">
          <Input bind:value={query} divClass="w-full" class="w-full border-gray-700 bg-gray-900 pl-11 text-white" leftClass="pointer-events-none w-10 justify-center text-gray-400" placeholder="Поиск контактов...">
            {#snippet left()}<Search size={15}/>{/snippet}
          </Input>
        </div>
        <Button color="green" class="ml-auto" onclick={() => showCreate = true}><Plus size={16}/> Новый контакт</Button>
      </div>
    </Card>

    <div class="p-5 lg:p-8">
      {#if errorMessage}<div class="mb-5 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{errorMessage}</div>{/if}

      <div class="mb-6 flex items-center gap-3">
        <div class="grid size-11 place-items-center rounded-2xl bg-lime-400/10 text-lime-300"><UserRound size={21}/></div>
        <div>
          <div class="flex items-center gap-2"><h1 class="text-3xl font-bold tracking-tight">Контакты</h1><Badge color="gray">{filtered.length}</Badge></div>
          <p class="mt-1 text-sm text-gray-500">Люди, телефоны, Telegram, LinkedIn и важные соцсети.</p>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3 {loading ? 'opacity-50' : ''}">
        {#each filtered as contact}
          <Card class="flex h-full max-w-none flex-col border-gray-800 bg-gray-900 p-4">
            <div class="flex items-start gap-3">
              <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-gray-800 text-lime-400">
                <UserRound size={18}/>
              </div>
              <div class="min-w-0 flex-1">
                <h2 class="truncate font-semibold">{contact.name}</h2>
                {#if contact.phone}<a class="mt-1 flex items-center gap-1.5 text-xs text-gray-400 hover:text-lime-300" href={`tel:${contact.phone}`}><Phone size={12}/>{contact.phone}</a>{/if}
              </div>
              <Button color="dark" size="xs" onclick={() => removeContact(contact.id)} aria-label={`Удалить контакт: ${contact.name}`}><Trash2 size={13}/></Button>
            </div>

            <div class="mt-4 space-y-2 text-sm">
              {#if contact.telegram}
                <a class="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-gray-300 hover:text-lime-300" href={contact.telegram} target="_blank" rel="noreferrer">
                  <MessageCircle size={14}/><span class="min-w-0 flex-1 truncate">{displayHandle(contact.telegram, 'Telegram')}</span><ExternalLink size={12}/>
                </a>
              {/if}
              {#if contact.linkedin}
                <a class="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-gray-300 hover:text-blue-300" href={contact.linkedin} target="_blank" rel="noreferrer">
                  <Linkedin size={14}/><span class="min-w-0 flex-1 truncate">{displayHandle(contact.linkedin, 'LinkedIn')}</span><ExternalLink size={12}/>
                </a>
              {/if}
              {#if contact.social}
                <a class="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-gray-300 hover:text-purple-300" href={contact.social} target="_blank" rel="noreferrer">
                  <AtSign size={14}/><span class="min-w-0 flex-1 truncate">{displayHandle(contact.social, 'Соцсеть')}</span><ExternalLink size={12}/>
                </a>
              {/if}
            </div>

            <p class="mt-3 min-h-5 text-sm leading-relaxed text-gray-500">{contact.note}</p>
            {#if contact.comments}
              <div class="mt-3 rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                <div class="mb-1 text-xs font-medium uppercase tracking-wide text-gray-600">Комментарии</div>
                <p class="whitespace-pre-wrap text-sm leading-relaxed text-gray-400">{contact.comments}</p>
              </div>
            {/if}
          </Card>
        {:else}
          <Card class="max-w-none border-dashed border-gray-700 bg-gray-900 p-12 text-center md:col-span-2 xl:col-span-3">
            <UserRound size={30} class="mx-auto mb-3 text-gray-600"/>
            <p class="text-gray-400">{loading ? 'Загрузка контактов...' : 'Контактов пока нет'}</p>
            {#if !loading}<Button color="green" class="mt-4" onclick={() => showCreate = true}><Plus size={15}/> Добавить первый контакт</Button>{/if}
          </Card>
        {/each}
      </div>
    </div>
  </main>
</div>

<Modal bind:open={showCreate} title="Новый контакт" size="md" class="border border-gray-700 bg-gray-900 text-white" headerClass="border-b border-gray-700 bg-gray-900 text-white" bodyClass="bg-gray-900" closeBtnClass="text-gray-400 hover:bg-gray-800">
  <form onsubmit={(event) => { event.preventDefault(); addContact(); }}>
    <label class="block text-sm text-gray-400">Имя<Input bind:value={name} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="Например, Андрей"/></label>
    <label class="mt-4 block text-sm text-gray-400">Телефон<Input bind:value={phone} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="+7 ..."/></label>
    <label class="mt-4 block text-sm text-gray-400">Telegram<Input bind:value={telegram} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="@username или ссылка"/></label>
    <label class="mt-4 block text-sm text-gray-400">LinkedIn<Input bind:value={linkedin} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="andrei-parkhomenko или ссылка"/></label>
    <label class="mt-4 block text-sm text-gray-400">Соцсеть<Input bind:value={social} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="x.com/profile, instagram.com/..."/></label>
    <label class="mt-4 block text-sm text-gray-400">Заметка<Textarea bind:value={note} rows={3} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="Кто это, когда написать, важный контекст"/></label>
    <label class="mt-4 block text-sm text-gray-400">Комментарии<Textarea bind:value={comments} rows={4} class="mt-2 border-gray-700 bg-gray-800 text-white" placeholder="История общения, детали, договоренности"/></label>
    <Button type="submit" color="green" class="mt-5 w-full justify-center"><Plus size={16}/> Добавить контакт</Button>
  </form>
</Modal>
