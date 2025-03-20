<script lang="ts">
  import KanbanBoard from '$lib/components/KanbanBoard.svelte';
</script>

<KanbanBoard />

<style>
  :global(html, body) {
    height: 100%;
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f9f9f9;
    overscroll-behavior: none;
  }
  
  :global(*, *:before, *:after) {
    box-sizing: border-box;
  }
  
  :global(body) {
    display: flex;
    flex-direction: column;
  }
  
  :global(#svelte) {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
</style>
