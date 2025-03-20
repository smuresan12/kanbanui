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
  let columnEl: HTMLElement;
  let stickiesContainerEl: HTMLElement;
  
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
    
    // If the column is empty or we're dragging over the column but not a sticky
    if (stickies.length === 0 || event.currentTarget === columnEl || event.currentTarget === stickiesContainerEl) {
      isDragOver = true;
    }
  }
  
  function handleDragLeave(event: DragEvent) {
    // Only set isDragOver to false if we're leaving the column itself
    if (event.currentTarget === columnEl || event.currentTarget === stickiesContainerEl) {
      isDragOver = false;
    }
  }
  
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
    
    const stickyId = event.dataTransfer?.getData('text/plain');
    if (stickyId) {
      // If we're dropping directly on the column, move the sticky to this column
      kanbanStore.moveSticky(stickyId, column);
    }
  }
  
  function handleStickyDragOver(event: DragEvent, stickyId: string) {
    event.preventDefault();
    // Add a class to indicate where the sticky will be dropped
    const target = event.currentTarget as HTMLElement;
    
    // Get the dragged sticky ID
    const draggedId = event.dataTransfer?.types.includes('text/plain') 
      ? event.dataTransfer?.getData('text/plain') 
      : null;
    
    // If we're dragging onto ourselves, do nothing
    if (draggedId === stickyId) {
      target.classList.remove('drag-over-top', 'drag-over-bottom');
      return;
    }
    
    // Determine if we're hovering over the top or bottom half
    const rect = target.getBoundingClientRect();
    const mouseY = event.clientY;
    const threshold = rect.top + rect.height / 2;
    
    target.classList.remove('drag-over-top', 'drag-over-bottom');
    if (mouseY < threshold) {
      target.classList.add('drag-over-top');
    } else {
      target.classList.add('drag-over-bottom');
    }
  }
  
  function handleStickyDragLeave(event: DragEvent) {
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over-top', 'drag-over-bottom');
  }
  
  function handleStickyDrop(event: DragEvent, targetStickyId: string) {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    const isTopHalf = target.classList.contains('drag-over-top');
    target.classList.remove('drag-over-top', 'drag-over-bottom');
    
    const draggedStickyId = event.dataTransfer?.getData('text/plain');
    if (!draggedStickyId) return;
    
    // If the sticky is being dropped on itself, do nothing
    if (draggedStickyId === targetStickyId) return;
    
    // Get the dragged sticky
    const draggedSticky = stickies.find(s => s.id === draggedStickyId);
    
    // If the sticky is from another column, just move it to this column
    if (!draggedSticky || draggedSticky.column !== column) {
      kanbanStore.moveSticky(draggedStickyId, column);
      return;
    }
    
    // Otherwise reorder it, passing whether to insert before or after the target
    kanbanStore.reorderSticky(draggedStickyId, targetStickyId, isTopHalf);
  }
  
  // Add a method to insert at the beginning of a column
  function handleEmptyColumnDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
    
    const draggedStickyId = event.dataTransfer?.getData('text/plain');
    if (!draggedStickyId) return;
    
    // Move the sticky to this column
    kanbanStore.moveSticky(draggedStickyId, column);
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
  bind:this={columnEl}
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
  
  <div 
    class="stickies"
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleEmptyColumnDrop}
    bind:this={stickiesContainerEl}
  >
    <!-- Drop zone for the beginning of the column -->
    {#if stickies.length > 0}
      <div class="drop-zone drop-zone-top" on:dragover|preventDefault on:drop={handleEmptyColumnDrop}></div>
    {/if}
    
    {#each stickies as sticky (sticky.id)}
      <div
        class="sticky-wrapper"
        on:dragover={(e) => handleStickyDragOver(e, sticky.id)}
        on:dragleave={handleStickyDragLeave}
        on:drop={(e) => handleStickyDrop(e, sticky.id)}
      >
        <Sticky 
          {sticky} 
          isEditing={editingStickyId === sticky.id}
          on:delete={handleDeleteSticky}
          on:editDone={() => editingStickyId = null}
        />
      </div>
    {/each}
    
    <!-- Drop zone for the end of the column -->
    {#if stickies.length > 0}
      <div class="drop-zone drop-zone-bottom" on:dragover|preventDefault on:drop={handleEmptyColumnDrop}></div>
    {/if}
    
    {#if stickies.length === 0}
      <div 
        class="empty-column-placeholder"
        on:dragover|preventDefault
        on:drop={handleEmptyColumnDrop}
      >
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
    padding: 5px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    /* Better scrolling on touch devices */
    -webkit-overflow-scrolling: touch;
  }
  
  .drop-zone {
    height: 15px;
    flex-shrink: 0;
    border: 2px dashed transparent;
    border-radius: 4px;
    transition: all 0.2s ease;
    position: relative;
  }
  
  .drop-zone:after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 70%;
    height: 2px;
    background-color: transparent;
    transition: all 0.2s ease;
  }
  
  .drop-zone:hover,
  .drop-zone-top:hover {
    border-color: #4caf50;
    background-color: rgba(76, 175, 80, 0.1);
  }
  
  .drop-zone:hover:after {
    background-color: rgba(76, 175, 80, 0.5);
  }
  
  .drop-zone-top {
    margin-bottom: 5px;
  }
  
  .drop-zone-bottom {
    margin-top: 5px;
  }
  
  .sticky-wrapper {
    position: relative;
    padding: 3px 0;
    border: 2px solid transparent;
    border-radius: 3px;
    transition: all 0.15s ease;
  }

  .sticky-wrapper.drag-over-top {
    border-top: 3px dashed #4caf50;
    padding-top: 0;
    margin-top: 4px;
    z-index: 1;
  }

  .sticky-wrapper.drag-over-bottom {
    border-bottom: 3px dashed #4caf50;
    padding-bottom: 0;
    margin-bottom: 4px;
    z-index: 1;
  }
  
  /* Highlight the column when dragging over */
  .column.drag-over {
    background-color: rgba(76, 175, 80, 0.1);
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.4);
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
  
  /* When column is in drag-over state, make drop zones more visible */
  .column.drag-over .drop-zone {
    border-color: rgba(76, 175, 80, 0.5);
    height: 20px;
  }
  
  .column.drag-over .drop-zone:after {
    background-color: rgba(76, 175, 80, 0.5);
  }
</style> 