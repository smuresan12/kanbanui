<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Sticky } from '../types';
  import { kanbanStore } from '../stores/kanbanStore';
  
  export let sticky: Sticky;
  export let isEditing = false;
  
  let editableText = sticky.text;
  let editableColor = sticky.color;
  let usedColors: string[] = [];
  
  const dispatch = createEventDispatcher<{
    delete: { id: string };
    editDone: { id: string };
  }>();
  
  // Subscribe to the store to get used colors
  const unsubscribe = kanbanStore.subscribe(state => {
    usedColors = state.usedColors;
  });
  
  function handleDelete() {
    dispatch('delete', { id: sticky.id });
  }
  
  function handleEdit() {
    isEditing = true;
  }
  
  function handleSave() {
    kanbanStore.updateSticky(sticky.id, {
      text: editableText,
      color: editableColor
    });
    isEditing = false;
    dispatch('editDone', { id: sticky.id });
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Escape') {
      isEditing = false;
      editableText = sticky.text;
      editableColor = sticky.color;
      dispatch('editDone', { id: sticky.id });
    }
  }
  
  // Clean up subscription
  import { onDestroy } from 'svelte';
  onDestroy(unsubscribe);
</script>

<div 
  class="sticky"
  style="background-color: {sticky.color};"
  draggable={!isEditing}
  on:dragstart={(e) => {
    e.dataTransfer?.setData('text/plain', sticky.id);
  }}
>
  {#if isEditing}
    <div class="sticky-edit">
      <textarea 
        bind:value={editableText}
        on:keydown={handleKeyDown}
        placeholder="Enter sticky text..."
        autoFocus
      ></textarea>
      
      <div class="color-selector">
        <div class="color-options">
          {#each usedColors as color}
            <button 
              class="color-option" 
              style="background-color: {color}" 
              class:selected={editableColor === color}
              on:click={() => editableColor = color}
              title={color}
            ></button>
          {/each}
        </div>
        
        <div class="color-input">
          <input 
            type="color" 
            bind:value={editableColor}
            id="colorPicker"
          >
          <label for="colorPicker">Custom</label>
        </div>
      </div>
      
      <div class="sticky-actions">
        <button class="save-btn" on:click={handleSave}>Save</button>
        <button class="cancel-btn" on:click={() => {
          isEditing = false;
          editableText = sticky.text;
          editableColor = sticky.color;
          dispatch('editDone', { id: sticky.id });
        }}>Cancel</button>
      </div>
    </div>
  {:else}
    <div class="sticky-content">
      <p>{sticky.text}</p>
      <div class="sticky-controls">
        <button class="edit-btn" on:click={handleEdit} title="Edit">✏️</button>
        <button class="delete-btn" on:click={handleDelete} title="Delete">🗑️</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .sticky {
    position: relative;
    width: 100%;
    margin-bottom: 10px;
    padding: 15px;
    border-radius: 3px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    cursor: grab;
    word-break: break-word;
    box-sizing: border-box;
  }
  
  .sticky:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
  
  .sticky-content {
    min-height: 50px;
  }
  
  .sticky p {
    margin: 0;
    font-family: 'Comic Sans MS', cursive, sans-serif;
    font-size: 16px;
    line-height: 1.4;
  }
  
  .sticky-controls {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
    opacity: 0.4;
    transition: opacity 0.2s;
    flex-wrap: nowrap;
  }
  
  .sticky:hover .sticky-controls {
    opacity: 1;
  }
  
  .edit-btn, .delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    margin-left: 5px;
    padding: 2px;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    min-height: 24px;
  }
  
  .sticky-edit {
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
    font-size: 16px;
  }
  
  .color-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .color-options {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  
  .color-option {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
  }
  
  .color-option.selected {
    border-color: #333;
    transform: scale(1.1);
  }
  
  .color-input {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .sticky-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  
  .save-btn, .cancel-btn {
    padding: 5px 10px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
  }
  
  .save-btn {
    background-color: #4caf50;
    color: white;
  }
  
  .cancel-btn {
    background-color: #f44336;
    color: white;
  }
</style> 