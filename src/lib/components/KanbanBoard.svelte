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
    height: 100%;
    padding: 20px;
    background-color: #f9f9f9;
    width: 100%;
    box-sizing: border-box;
  }
  
  .board-header {
    margin-bottom: 20px;
    text-align: center;
  }
  
  h1 {
    margin: 0;
    color: #333;
    font-size: 28px;
    font-family: 'Comic Sans MS', cursive, sans-serif;
  }
  
  .board {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 20px;
    height: calc(100% - 80px);
    align-items: flex-start;
    gap: 20px;
    width: 100%;
    justify-content: space-between;
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
  
  @media (max-width: 768px) {
    .board {
      padding-bottom: 10px;
    }
    
    h1 {
      font-size: 24px;
    }
  }
</style> 