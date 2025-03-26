<script lang="ts">
  import type { Column as ColumnType, Sticky as StickyType } from '../types';
  import Sticky from './Sticky.svelte';
  import { kanbanStore } from '../stores/kanbanStore';
  import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { createEventDispatcher } from 'svelte';
  
  export let column: ColumnType;
  export let stickies: StickyType[] = [];
  
  let isAddingSticky = false;
  let newStickyText = '';
  let newStickyColor = '#ffcc00';
  let editingStickyId: string | null = null;
  
  const flipDurationMs = 200;
  const dispatch = createEventDispatcher();
  
  function handleAddSticky() {
    if (newStickyText.trim()) {
      kanbanStore.addSticky(newStickyText.trim(), newStickyColor, column);
      newStickyText = '';
      isAddingSticky = false;
    }
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
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleAddSticky();
    } else if (event.key === 'Escape') {
      isAddingSticky = false;
      newStickyText = '';
    }
  }
</script>

<div class="column">
  <div class="column-header">
    <h2>{column}</h2>
    <button 
      class="add-sticky-btn" 
      on:click={() => isAddingSticky = !isAddingSticky}
      title="Add new sticky"
    >
      {#if isAddingSticky}✖{:else}+{/if}
    </button>
  </div>
  
  {#if isAddingSticky}
    <div class="add-sticky-form">
      <textarea
        bind:value={newStickyText}
        on:keydown={handleKeyDown}
        placeholder="Enter sticky text..."
        autoFocus
      ></textarea>
      
      <div class="color-input">
        <input type="color" bind:value={newStickyColor} id="newStickyColor">
        <label for="newStickyColor">Color</label>
      </div>
      
      <div class="form-actions">
        <button class="add-btn" on:click={handleAddSticky}>Add</button>
        <button class="cancel-btn" on:click={() => {
          isAddingSticky = false;
          newStickyText = '';
        }}>Cancel</button>
      </div>
    </div>
  {/if}
  
  <div class="stickies">
    <!-- Add a dropzone using dndzone action for stickies -->
    <section 
      class="stickies-container"
      class:empty={stickies.length === 0}
      use:dndzone={{items: stickies, flipDurationMs, type: "sticky"}}
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
            {sticky} 
            isEditing={editingStickyId === sticky.id}
            on:delete={handleDeleteSticky}
            on:editDone={() => editingStickyId = null}
          />
        </div>
      {/each}
      
      <!-- Empty column placeholder inside the dropzone -->
      {#if stickies.length === 0}
        <div class="empty-column-placeholder">
          <p>Drop stickies here or add a new one</p>
        </div>
      {/if}
    </section>
  </div>
</div>

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
  
  .stickies {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    margin: 0 -3px; /* Give space for the shadows of stickies */
    padding: 0 3px; /* Compensate for the negative margin */
    display: flex;
    flex-direction: column;
    min-height: 0; /* Needed for proper scrolling within flex container */
  }
  
  .stickies-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 3px 0;
    min-height: 50px; /* Ensure there's always space for drop */
    flex: 1; /* Take up all available space */
  }
  
  /* When empty, make the container fill the height for easier dropping */
  .stickies-container.empty {
    min-height: 100%;
    border-radius: 5px;
    transition: all 0.2s ease;
  }
  
  /* Highlight when dragging over the empty container */
  .stickies-container.empty:hover,
  .stickies-container.empty:focus-within {
    background-color: rgba(0, 0, 0, 0.02);
  }
  
  .sticky-wrapper {
    width: 100%;
  }
  
  /* Ensure no transitions interfere with dragged items */
  .sticky-wrapper.has-shadow-item {
    transition: none !important;
  }
  
  .add-sticky-form {
    margin-bottom: 10px;
    background-color: white;
    padding: 8px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    flex-shrink: 0; /* Prevent form from shrinking */
  }
  
  textarea {
    width: 100%;
    min-height: 70px;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 8px;
    font-family: inherit;
    font-size: 14px;
    resize: vertical;
  }
  
  textarea:focus {
    outline: none;
    border-color: #aaa;
  }
  
  .color-input {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  
  input[type="color"] {
    margin-right: 6px;
    height: 22px;
    width: 22px;
    border: none;
    cursor: pointer;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
  }
  
  .add-btn, .cancel-btn {
    padding: 5px 10px;
    background-color: #333;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
  }
  
  .add-btn:hover {
    background-color: #555;
  }
  
  .cancel-btn {
    background-color: #999;
  }
  
  .cancel-btn:hover {
    background-color: #777;
  }
  
  .empty-column-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 2px dashed #ccc;
    border-radius: 5px;
    padding: 15px;
    margin: 8px 0;
    color: #999;
    text-align: center;
    min-height: 80px;
    flex: 1; /* Make placeholder take up available space */
    cursor: default;
  }
  
  .empty-column-placeholder p {
    margin: 0;
    font-size: 13px;
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
    }
    
    .empty-column-placeholder {
      padding: 10px;
      min-height: 60px;
    }
    
    .empty-column-placeholder p {
      font-size: 12px;
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
    }
  }
</style> 