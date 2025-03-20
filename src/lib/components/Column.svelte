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
    background-color: #f5f5f5;
    border-radius: 5px;
    width: 300px;
    min-height: 300px;
    display: flex;
    flex-direction: column;
    padding: 10px;
    margin: 0 10px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
  }
  
  .column-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 15px;
  }
  
  .column-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
  
  .add-sticky-btn {
    background: #e0e0e0;
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    cursor: pointer;
    color: #555;
    transition: background-color 0.2s;
  }
  
  .add-sticky-btn:hover {
    background-color: #d0d0d0;
  }
  
  .stickies {
    flex: 1;
    overflow-y: auto;
    padding-right: 5px;
    width: 100%;
    box-sizing: border-box;
  }
  
  .add-sticky-form {
    background-color: white;
    border-radius: 3px;
    padding: 10px;
    margin-bottom: 15px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  textarea {
    width: 100%;
    min-height: 80px;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 3px;
    resize: vertical;
    font-family: 'Comic Sans MS', cursive, sans-serif;
  }
  
  .color-input {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  
  .add-btn, .cancel-btn {
    padding: 5px 10px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
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
</style> 