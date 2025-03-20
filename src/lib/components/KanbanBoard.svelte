<script lang="ts">
  import { onMount } from 'svelte';
  import { COLUMNS, type Sticky } from '../types';
  import { kanbanStore } from '../stores/kanbanStore';
  import Column from './Column.svelte';
  import CleanupPrompt from './CleanupPrompt.svelte';
  
  let stickiesByColumn: Record<string, Sticky[]> = {};
  let oldDoneStickies: Sticky[] = [];
  let showCleanupPrompt = false;
  
  // Subscribe to the store
  const unsubscribe = kanbanStore.subscribe(state => {
    // Group stickies by column
    stickiesByColumn = COLUMNS.reduce((acc, column) => {
      acc[column] = state.stickies.filter(s => s.column === column);
      return acc;
    }, {} as Record<string, Sticky[]>);
  });
  
  // Check for old stickies in the Done column on mount
  onMount(() => {
    // Check if we have old stickies
    oldDoneStickies = kanbanStore.getOldDoneStickies();
    if (oldDoneStickies.length > 0) {
      showCleanupPrompt = true;
    }
  });
  
  function handleCleanupComplete() {
    showCleanupPrompt = false;
  }
  
  // Clean up subscription
  import { onDestroy } from 'svelte';
  onDestroy(unsubscribe);
</script>

<main>
  <div class="board-header">
    <h1>Kanban Board</h1>
  </div>
  
  <div class="board">
    {#each COLUMNS as column}
      <Column 
        {column} 
        stickies={stickiesByColumn[column] || []} 
      />
    {/each}
  </div>
  
  {#if showCleanupPrompt}
    <CleanupPrompt 
      oldStickies={oldDoneStickies} 
      on:confirm={handleCleanupComplete}
      on:cancel={handleCleanupComplete}
    />
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    overflow: hidden;
    box-sizing: border-box;
  }
  
  .board-header {
    padding: 15px;
    text-align: center;
    flex-shrink: 0;
  }
  
  h1 {
    margin: 0;
    color: #333;
    font-size: 28px;
    font-family: 'Comic Sans MS', cursive, sans-serif;
  }
  
  .board {
    display: flex;
    flex: 1;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 10px;
    gap: 15px;
    min-height: 0; /* Important for preventing overflow */
    justify-content: stretch; /* Make columns stretch to fill width */
  }
  
  /* Scrollbar styling */
  .board::-webkit-scrollbar {
    height: 8px;
  }
  
  .board::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .board::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 4px;
  }
  
  .board::-webkit-scrollbar-thumb:hover {
    background: #ccc;
  }
  
  @media (max-width: 1024px) {
    /* Below this breakpoint, switch to scrollable columns */
    .board {
      justify-content: flex-start; /* Allow columns to be scrollable */
    }
  }
  
  @media (max-width: 768px) {
    .board {
      padding: 8px;
      gap: 8px;
      flex-wrap: nowrap;
    }
    
    h1 {
      font-size: 22px;
    }
  }
  
  @media (max-width: 480px) {
    /* For very small screens, make header more compact */
    .board-header {
      padding: 8px;
    }
    
    h1 {
      font-size: 20px;
    }
    
    .board {
      gap: 12px;
    }
  }
</style> 