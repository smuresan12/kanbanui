<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Sticky } from '../types';
  import { kanbanStore } from '../stores/kanbanStore';
  import { SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  
  export let sticky: Sticky;
  export let isEditing = false;
  
  // Check if this is a shadow item (being dragged)
  // This checks both for the SHADOW_ITEM_MARKER_PROPERTY_NAME property
  // and ensures we're not treating it as undefined
  $: isDragged = sticky && SHADOW_ITEM_MARKER_PROPERTY_NAME in sticky && 
                 Boolean(sticky[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
  
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
  class:is-dragged={isDragged}
  style="background-color: {sticky.color};"
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
    /* Disable transition during drag operations */
    transition: box-shadow 0.2s ease;
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
  }
  
  /* Special styling for when the sticky is being dragged */
  .sticky.is-dragged {
    /* Remove transitions and transformations during drag */
    transition: none !important;
    transform: none !important;
    box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.2) !important;
    z-index: 10 !important;
  }
  
  /* Disable all transitions within a dragged sticky */
  .sticky.is-dragged * {
    transition: none !important;
    animation: none !important;
  }
  
  /* Make sure control buttons stay visible when dragged */
  .sticky.is-dragged .sticky-controls {
    opacity: 1 !important;
  }

  /* Prevent hover effects during drag */
  .sticky.is-dragged:hover,
  .sticky.is-dragged .edit-btn:hover,
  .sticky.is-dragged .delete-btn:hover {
    transform: none !important;
  }
  
  /* Separate transforms from transitions */
  .sticky:not(.is-dragged):hover {
    transform: scale(1.02) rotate(0deg);
    box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.2);
    z-index: 1;
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
  
  /* Sticky edit form styles */
  .sticky-edit {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .sticky-edit textarea {
    width: 100%;
    min-height: 80px;
    padding: 8px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 3px;
    resize: vertical;
    font-family: 'Comic Sans MS', cursive, sans-serif;
    font-size: 14px;
    background-color: rgba(255, 255, 255, 0.9);
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
    gap: 5px;
    margin-top: 5px;
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
  
  .sticky-actions {
    display: flex;
    justify-content: flex-end;
    gap: 5px;
    margin-top: auto;
  }
  
  .cancel-btn, .save-btn {
    padding: 6px 10px;
    border: none;
    border-radius: 3px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .save-btn {
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
  }
  
  .save-btn:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }
  
  .cancel-btn {
    background-color: rgba(0, 0, 0, 0.2);
    color: rgba(0, 0, 0, 0.7);
  }
  
  .cancel-btn:hover {
    background-color: rgba(0, 0, 0, 0.3);
  }
  
  /* Mobile-specific adjustments */
  @media (max-width: 768px) {
    .sticky {
      padding: 12px;
      min-height: 60px;
    }
    
    .sticky p {
      font-size: 14px;
    }
    
    .edit-btn, .delete-btn {
      min-width: 24px;
      min-height: 24px;
      font-size: 14px;
    }
    
    .sticky-edit textarea {
      min-height: 60px;
      font-size: 14px;
    }
    
    .cancel-btn, .save-btn {
      padding: 5px 8px;
      font-size: 12px;
    }
  }
</style> 