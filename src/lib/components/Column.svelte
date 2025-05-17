<script lang="ts">
  import type { Sticky as StickyType } from '../types';
  import Sticky from './Sticky.svelte';
  import { kanbanStore } from '../stores/kanbanStore';
  import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { createEventDispatcher, onMount } from 'svelte';
  import DeleteDoneConfirmPrompt from './DeleteDoneConfirmPrompt.svelte';
  
  export let column: string;
  export let stickies: StickyType[] = [];
  
  let editingStickyId: string | null = null;
  let usedColors: string[] = [];
  let defaultColor = '#ffcc00';
  
  const flipDurationMs = 200;
  const dispatch = createEventDispatcher();
  
  // Subscribe to the store to get used colors
  const unsubscribe = kanbanStore.subscribe(state => {
    usedColors = state.usedColors;
    // Set default color to the first available color or default to yellow
    defaultColor = usedColors.length > 0 ? usedColors[0] : '#ffcc00';
  });
  
  function handleAddSticky() {
    // Add a new sticky with empty text
    kanbanStore.addSticky("", defaultColor, column, true);
  }
  
  function handleDeleteSticky(event: CustomEvent<{ id: string }>) {
    kanbanStore.deleteSticky(event.detail.id);
  }
  
  interface DndEventDetail {
    items: StickyType[];
    info: {
      id: string;
      [key: string]: any;
    };
  }
  
  function handleDndConsider(e: CustomEvent<DndEventDetail>) {
    stickies = e.detail.items;
    dispatch('consider', e.detail);
  }
  
  function handleDndFinalize(e: CustomEvent<DndEventDetail>) {
    stickies = e.detail.items;
    dispatch('finalize', e.detail);
  }
  
  // Clean up subscription
  import { onDestroy } from 'svelte';
  onDestroy(unsubscribe);
  
  // For Done column delete functionality
  let showDeleteConfirm = false;
  
  function handleDeleteDoneClick() {
    showDeleteConfirm = true;
  }
  
  function handleDeleteConfirmClose() {
    showDeleteConfirm = false;
  }
</script>

<div class="column">
  <div class="column-header">
    <h2>{column}</h2>
    <div class="header-actions">
      {#if column === 'Done' && stickies.length > 0}
        <button 
          class="delete-done-btn" 
          on:click|stopPropagation|preventDefault={handleDeleteDoneClick}
          title="Delete all done stickies"
        >
          <span class="trash-icon">🗑️</span>
        </button>
      {/if}
      <button 
        class="add-sticky-btn" 
        on:click|stopPropagation|preventDefault={handleAddSticky}
        title="Add new sticky"
      >+</button>
    </div>
  </div>
  
  <div class="stickies">
    <section 
      class="stickies-container"
      class:empty={stickies.length === 0}
      use:dndzone={{
        items: stickies, 
        flipDurationMs, 
        type: "sticky",
        dropTargetStyle: { outline: 'none' }
      }}
      on:consider={handleDndConsider}
      on:finalize={handleDndFinalize}
    >
      {#each stickies as sticky (sticky.id + (sticky[SHADOW_ITEM_MARKER_PROPERTY_NAME] ? '_shadow' : ''))}
        <div 
          class="sticky-wrapper"
          class:has-shadow-item={sticky[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
          animate:flip={!sticky[SHADOW_ITEM_MARKER_PROPERTY_NAME] ? {duration: flipDurationMs} : undefined}
          data-is-dnd-shadow-item-hint={sticky[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
        >
          <Sticky 
            bind:sticky={sticky} 
            on:delete={handleDeleteSticky}
            on:editDone={() => editingStickyId = null}
          />
        </div>
      {/each}
    </section>
  </div>
</div>

{#if showDeleteConfirm && column === 'Done'}
  <DeleteDoneConfirmPrompt 
    stickies={stickies} 
    on:confirm={handleDeleteConfirmClose}
    on:cancel={handleDeleteConfirmClose}
  />
{/if}

<style>
  .column {
    display: flex;
    flex-direction: column;
    background-color: #f5f5f5;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    padding: 8px;
    box-sizing: border-box;
    position: relative;
    flex: 1 1 0; /* Equal flex-grow, equal flex-shrink, zero flex-basis */
    height: 100%; /* Fill available height */
    max-height: 100%; /* Ensure column doesn't grow beyond container */
    overflow: hidden; /* Prevent column overflow */
    min-width: 150px; /* Minimum width to prevent columns from getting too narrow */
  }
  
  .column-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 8px;
    flex-shrink: 0; /* Prevent header from shrinking */
  }
  
  .header-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  h2 {
    margin: 0;
    font-size: 18px;
    color: #333;
    font-weight: 600;
  }
  
  .add-sticky-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background-color: #6c6c6c;
    color: white;
    border: none;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .add-sticky-btn:hover {
    background-color: #555;
    transform: scale(1.05);
  }
  
  .delete-done-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background-color: #6c6c6c;
    color: white;
    border: none;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .delete-done-btn:hover {
    background-color: #555;
    transform: scale(1.05);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.25);
  }
  
  .trash-icon {
    font-size: 12px;
    filter: brightness(1.5);
  }
  
  .stickies {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    margin: 0 -3px; /* Give space for the shadows of stickies */
    padding: 0 3px; /* Compensate for the negative margin */
    display: flex;
    flex-direction: column;
    min-height: 0; /* Needed for proper scrolling within flex container */
    position: relative; /* Add position context for absolute children */
  }
  
  .stickies-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 3px 0;
    min-height: 100px; /* Minimum height for empty container */
    flex: 1; /* Take up all available space */
    position: relative; /* Position context for drop placeholder */
    z-index: 1; /* Ensure it's above the placeholder */
  }
  
  /* When empty, make the container fill the height for easier dropping */
  .stickies-container.empty {
    height: 100%;
    min-height: calc(100% - 20px);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    transition: all 0.2s ease;
    background-color: transparent; /* Make background transparent to see placeholder */
  }
  
  /* Add hover effect for all stickies containers, not just empty ones */
  .stickies-container:hover,
  .stickies-container:focus-within {
    background-color: rgba(0, 0, 0, 0.02);
  }
  
  .sticky-wrapper {
    width: 100%;
  }
  
  /* Ensure no transitions interfere with dragged items */
  .sticky-wrapper.has-shadow-item {
    transition: none !important;
  }
  
  /* Scrollbar styling */
  .stickies::-webkit-scrollbar {
    width: 4px;
  }
  
  .stickies::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 2px;
  }
  
  .stickies::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 2px;
  }
  
  .stickies::-webkit-scrollbar-thumb:hover {
    background: #ccc;
  }
  
  @media (max-width: 768px) {
    .column {
      padding: 6px;
      min-width: 200px;
    }
    
    .column-header {
      padding-bottom: 6px;
      margin-bottom: 6px;
    }
    
    h2 {
      font-size: 14px;
    }
    
    .add-sticky-btn {
      width: 22px;
      height: 22px;
      font-size: 14px;
    }
    
    .stickies-container {
      gap: 6px;
      min-height: 80px; /* Smaller minimum height on smaller screens */
    }
    
  }
  
  @media (max-width: 480px) {
    .column {
      padding: 4px;
      min-width: 180px;
    }
    
    .column-header {
      padding-bottom: 4px;
      margin-bottom: 4px;
    }
    
    .stickies-container {
      gap: 4px;
      min-height: 60px; /* Even smaller minimum height on tiny screens */
    }
    
  }
</style>