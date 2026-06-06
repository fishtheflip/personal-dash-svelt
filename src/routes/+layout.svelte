<script lang="ts">
  import '../styles.css';
  import AuthGate from '$lib/AuthGate.svelte';
  let { children } = $props();
</script>

<AuthGate>
  {@render children()}
</AuthGate>
