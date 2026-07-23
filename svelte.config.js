import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const isProduction = process.env.NODE_ENV === 'production';
const basePath = process.env.BASE_PATH ?? (isProduction ? '/personal-dash-svelt' : '');

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: '404.html',
      precompress: false,
      strict: true
    }),
    paths: {
      base: basePath
    }
  }
};
