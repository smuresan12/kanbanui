<script lang="ts">
  import type { Column as ColumnType, Sticky as StickyType } from '../types';
  import Sticky from './Sticky.svelte';
  import { kanbanStore } from '../stores/kanbanStore';
  import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { createEventDispatcher, onMount } from 'svelte';
  
  export let column: ColumnType;
  export let stickies: StickyType[] = [];
  
  let isAddingSticky = false;
  let newStickyText = '';
  let newStickyColor = '#ffcc00';
  let editingStickyId: string | null = null;
  let addStickyForm: HTMLDivElement;
  let usedColors: string[] = [];
  
  const flipDurationMs = 200;
  const dispatch = createEventDispatcher();
  
  // Subscribe to the store to get used colors
  const unsubscribe = kanbanStore.subscribe(state => {
    usedColors = state.usedColors;
  });
  
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
  
  // Handle click outside
  function handleClickOutside(event: Event) {
    // Check if user clicked outside the form
    if (isAddingSticky && addStickyForm && 
        !addStickyForm.contains(event.target as Node) && 
        !(event.target as HTMLElement).classList.contains('add-sticky-btn')) {
      
      if (newStickyText.trim()) {
        handleAddSticky();
      } else {
        isAddingSticky = false;
      }
    }
  }
  
  function handleCancelBtn() {
    isAddingSticky = false;
    newStickyText = '';
    // Force a focus on the document body to ensure form loses focus
    if (typeof document !== 'undefined') {
      document.body.focus();
    }
  }
  
  function handleAddBtn() {
    isAddingSticky = true;
  }
  
  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('click', handleClickOutside);
      return () => {
        window.removeEventListener('click', handleClickOutside);
      };
    }
  });
  
  // Clean up subscription
  import { onDestroy } from 'svelte';
  onDestroy(unsubscribe);
</script>

<div class="column">
  <div class="column-header">
    <h2>{column}</h2>
    {#if isAddingSticky}
      <button 
        class="add-sticky-btn" 
        on:click|stopPropagation|preventDefault={handleCancelBtn}
        title="Cancel"
      >✖</button>
    {:else}
      <button 
        class="add-sticky-btn" 
        on:click|stopPropagation|preventDefault={handleAddBtn}
        title="Add new sticky"
      >+</button>
    {/if}
  </div>
  
  {#if isAddingSticky}
    <div class="add-sticky-form" bind:this={addStickyForm} on:click|stopPropagation>
      <textarea
        bind:value={newStickyText}
        on:keydown={handleKeyDown}
        placeholder="Enter sticky text..."
        autoFocus
        style="color: rgba(0, 0, 0, 0.9); background-color: {newStickyColor}80;"
      ></textarea>
      
      <div class="color-selector">
        <div class="color-options">
          {#each usedColors as color}
            <button 
              class="color-option" 
              style="background-color: {color}" 
              class:selected={newStickyColor === color}
              on:click={() => newStickyColor = color}
              title={color}
            ></button>
          {/each}
        </div>
        
        <div class="color-input">
          <input type="color" bind:value={newStickyColor} id="newStickyColor">
          <label for="newStickyColor">Custom</label>
        </div>
      </div>
      
      <div class="form-actions">
        <button class="cancel-btn" on:click|stopPropagation|preventDefault={handleCancelBtn}>Cancel</button>
      </div>
    </div>
  {/if}
  
  <div class="stickies">
    <!-- Empty column placeholder outside the dropzone -->
    {#if stickies.length === 0}
      <div class="empty-column-placeholder">
        <p>Drop stickies here or create a new one</p>
      </div>
    {/if}
    
    <!-- Add a dropzone using dndzone action for stickies -->
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
            {sticky} 
            isEditing={editingStickyId === sticky.id}
            on:delete={handleDeleteSticky}
            on:editDone={() => editingStickyId = null}
          />
        </div>
      {/each}
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
  
  .color-selector {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 8px;
  }
  
  .color-options {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .color-option {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    padding: 0;
  }
  
  .color-option:hover {
    transform: scale(1.1);
  }
  
  .color-option.selected {
    border-color: rgba(0, 0, 0, 0.3);
    transform: scale(1.1);
  }
  
  .color-input {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
  }
  
  .color-input input {
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    cursor: pointer;
  }
  
  .color-input label {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.7);
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
  }
  
  .cancel-btn {
    padding: 5px 10px;
    background-color: #333;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
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
    position: absolute;
    top: 0;
    left: 3px;
    right: 3px;
    bottom: 0;
    z-index: 0; /* Place it behind the dropzone */
    pointer-events: none; /* Ensure it doesn't interfere with mouse events */
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
      min-height: 80px; /* Smaller minimum height on smaller screens */
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
      min-height: 60px; /* Even smaller minimum height on tiny screens */
    }
    
    .empty-column-placeholder {
      padding: 8px;
      min-height: 50px;
    }
    
    .color-option {
      width: 18px;
      height: 18px;
    }
  }
</style> 