<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { Sticky } from '../types';
  import { kanbanStore } from '../stores/kanbanStore';
  
  export let sticky: Sticky;
  export let isEditing = false;
  
  let editableText = sticky.text;
  let editableColor = sticky.color;
  let usedColors: string[] = [];
  let stickyElement: HTMLElement;
  
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
  
  // Add touch events for mobile drag and drop
  onMount(() => {
    if (!stickyElement) return;
    
    let touchTimeout: ReturnType<typeof setTimeout>;
    
    stickyElement.addEventListener('touchstart', (e) => {
      if (isEditing) return;
      
      // Long press to initiate drag
      touchTimeout = setTimeout(() => {
        stickyElement.setAttribute('draggable', 'true');
        // Visual feedback that it's draggable
        stickyElement.style.opacity = '0.7';
      }, 300);
    });
    
    stickyElement.addEventListener('touchend', () => {
      clearTimeout(touchTimeout);
      stickyElement.removeAttribute('draggable');
      stickyElement.style.opacity = '1';
    });
    
    stickyElement.addEventListener('touchmove', () => {
      clearTimeout(touchTimeout);
    });
  });
  
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
  bind:this={stickyElement}
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
        <button class="cancel-btn" on:click={() => {
          isEditing = false;
          editableText = sticky.text;
          editableColor = sticky.color;
          dispatch('editDone', { id: sticky.id });
        }}>Cancel</button>
        <button class="save-btn" on:click={handleSave}>Save</button>
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
    margin: 0;
    padding: 15px;
    border-radius: 2px;
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
    cursor: grab;
    word-break: break-word;
    box-sizing: border-box;
    transform: rotate(var(--rotate, -1deg));
    --rotate: calc(-2deg + (Math.random() * 4deg));
    border-bottom-right-radius: 60px 5px;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    touch-action: none; /* Improve touch handling */
  }
  
  .sticky::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 0 20px 20px;
    border-color: transparent transparent rgba(0, 0, 0, 0.05) transparent;
    border-bottom-right-radius: 6px;
  }
  
  .sticky:nth-child(even) {
    transform: rotate(1deg);
  }
  
  .sticky:nth-child(3n) {
    transform: rotate(-1.5deg);
  }
  
  .sticky:nth-child(5n) {
    transform: rotate(2deg);
  }
  
  .sticky:hover {
    transform: scale(1.02) rotate(0deg);
    box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.2);
    z-index: 1;
  }
  
  .sticky-content {
    min-height: 50px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  
  .sticky p {
    margin: 0;
    font-family: 'Comic Sans MS', cursive, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: rgba(0, 0, 0, 0.8);
    text-shadow: 0.5px 0.5px 0px rgba(255, 255, 255, 0.5);
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
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 30px;
    min-height: 30px;
    border-radius: 50%;
    transition: all 0.2s;
    background-color: rgba(255, 255, 255, 0.3);
  }
  
  .edit-btn:hover, .delete-btn:hover {
    background-color: rgba(255, 255, 255, 0.6);
    transform: scale(1.1);
  }
  
  .sticky-edit {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
  
  textarea {
    width: 100%;
    min-height: 100px;
    padding: 10px;
    border: 1px dashed rgba(0, 0, 0, 0.2);
    border-radius: 3px;
    resize: vertical;
    font-family: 'Comic Sans MS', cursive, sans-serif;
    font-size: 16px;
    background-color: rgba(255, 255, 255, 0.5);
  }
  
  .color-selector {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .color-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .color-option {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: all 0.15s;
  }
  
  .color-option.selected {
    border-color: #333;
    transform: scale(1.15);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  }
  
  .color-option:hover {
    transform: scale(1.1);
  }
  
  .color-input {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .color-input input[type="color"] {
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    background: none;
  }
  
  .sticky-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 5px;
  }
  
  .save-btn, .cancel-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-family: 'Comic Sans MS', cursive, sans-serif;
    font-weight: bold;
    transition: all 0.2s;
  }
  
  .save-btn {
    background-color: #4caf50;
    color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .save-btn:hover {
    background-color: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  .cancel-btn {
    background-color: #f44336;
    color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .cancel-btn:hover {
    background-color: #e53935;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    .sticky {
      min-height: 70px;
      padding: 12px;
    }
    
    .sticky p {
      font-size: 14px;
    }
    
    .sticky-controls {
      position: absolute;
      bottom: 5px;
      right: 5px;
      background-color: rgba(255, 255, 255, 0.7);
      border-radius: 15px;
      padding: 3px;
      opacity: 0.8;
    }
    
    .sticky:active .sticky-controls {
      opacity: 1;
    }
    
    .edit-btn, .delete-btn {
      min-width: 28px;
      min-height: 28px;
      font-size: 14px;
    }
  }
</style> 