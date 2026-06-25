import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = env.PUBLIC_SUPABASE_URL;
const anonKey = env.PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

function isRetryableFetchError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return error instanceof TypeError
    || message.includes('NetworkError')
    || message.includes('Failed to fetch')
    || message.includes('Load failed');
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryingFetch(input: RequestInfo | URL, init?: RequestInit) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetch(input, init);
    } catch (error) {
      lastError = error;
      if (attempt === 2 || !isRetryableFetchError(error)) throw error;
      await wait(250 * (attempt + 1));
    }
  }
  throw lastError;
}

export const supabase: SupabaseClient | null =
  browser && url && anonKey ? createClient(url, anonKey, { global: { fetch: retryingFetch } }) : null;
