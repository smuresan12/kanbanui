<script lang="ts">
  import type { Column as ColumnType, Sticky as StickyType } from '../types';
  import Sticky from './Sticky.svelte';
  import { kanbanStore } from '../stores/kanbanStore';
  
  export let column: ColumnType;
  export let stickies: StickyType[] = [];
  
  let isAddingSticky = false;
  let newStickyText = '';
  let newStickyColor = '#ffcc00';
  let isDragOver = false;
  let editingStickyId: string | null = null;
  
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
  
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragOver = true;
  }
  
  function handleDragLeave() {
    isDragOver = false;
  }
  
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
    
    const stickyId = event.dataTransfer?.getData('text/plain');
    if (stickyId) {
      kanbanStore.moveSticky(stickyId, column);
    }
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

<div 
  class="column"
  class:drag-over={isDragOver}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
>
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
    {#each stickies as sticky (sticky.id)}
      <Sticky 
        {sticky} 
        isEditing={editingStickyId === sticky.id}
        on:delete={handleDeleteSticky}
        on:editDone={() => editingStickyId = null}
      />
    {/each}
    
    {#if stickies.length === 0}
      <div class="empty-column-placeholder">
        <p>Drag items here or add a new sticky</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .column {
    display: flex;
    flex-direction: column;
    background-color: #f5f5f5;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    padding: 12px;
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
    padding-bottom: 10px;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 12px;
    flex-shrink: 0; /* Prevent header from shrinking */
  }
  
  .column-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    font-family: 'Comic Sans MS', cursive, sans-serif;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .add-sticky-btn {
    background: #e0e0e0;
    border: none;
    width: 32px;
    height: 32px;
    min-width: 32px; /* Prevent shrinking */
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    cursor: pointer;
    color: #555;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-left: 8px;
  }
  
  .add-sticky-btn:hover {
    background-color: #d0d0d0;
    transform: scale(1.1);
  }
  
  .stickies {
    flex: 1;
    overflow-y: auto; /* Allow vertical scrolling within columns */
    overflow-x: hidden;
    padding-right: 5px;
    padding-bottom: 5px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    /* Better scrolling on touch devices */
    -webkit-overflow-scrolling: touch;
  }
  
  /* Add sticky form styling */
  .add-sticky-form {
    background-color: white;
    border-radius: 5px;
    padding: 12px;
    margin-bottom: 12px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex-shrink: 0;
  }
  
  textarea {
    width: 100%;
    min-height: 80px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    resize: vertical;
    font-family: 'Comic Sans MS', cursive, sans-serif;
    font-size: 14px;
  }
  
  .color-input {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  
  .add-btn, .cancel-btn {
    padding: 8px 12px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
  }
  
  .add-btn {
    background-color: #4caf50;
    color: white;
  }
  
  .cancel-btn {
    background-color: #f44336;
    color: white;
  }
  
  .drag-over {
    background-color: #e6f7ff;
    box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
  }
  
  .empty-column-placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px;
    border: 2px dashed #ccc;
    border-radius: 5px;
    color: #999;
    text-align: center;
    padding: 10px;
  }
  
  .empty-column-placeholder p {
    margin: 0;
    font-size: 14px;
  }
  
  /* Mobile adjustments */
  @media (max-width: 768px) {
    .column {
      flex: 0 0 270px; /* Fixed width for horizontal scrolling on mobile */
      padding: 10px;
    }
  }
  
  @media (max-width: 480px) {
    .column {
      flex: 0 0 85vw; /* One column takes most of the viewport on mobile */
      padding: 8px;
    }
    
    .column-header h2 {
      font-size: 16px;
    }
    
    .add-sticky-btn {
      width: 28px;
      height: 28px;
      min-width: 28px;
      font-size: 18px;
    }
  }
</style> 