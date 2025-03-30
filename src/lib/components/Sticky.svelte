<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
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
  let editForm: HTMLDivElement;
  
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
    if (editableText.trim()) {
      kanbanStore.updateSticky(sticky.id, {
        text: editableText,
        color: editableColor
      });
    }
    isEditing = false;
    dispatch('editDone', { id: sticky.id });
  }
  
  function handleCancel() {
    isEditing = false;
    editableText = sticky.text;
    editableColor = sticky.color;
    dispatch('editDone', { id: sticky.id });
    // Force a focus on the document body to ensure form loses focus
    if (typeof document !== 'undefined') {
      document.body.focus();
    }
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  }
  
  // Handle click outside
  function handleClickOutside(event: Event) {
    if (isEditing && editForm && 
        !editForm.contains(event.target as Node) && 
        !(event.target as HTMLElement).classList.contains('edit-btn')) {
      
      if (editableText.trim()) {
        handleSave();
      } else {
        handleCancel();
      }
    }
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

<div 
  class="sticky"
  class:is-dragged={isDragged}
  style="background-color: {sticky.color};"
>
  {#if isEditing}
    <div class="sticky-edit" bind:this={editForm} on:click|stopPropagation>
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
        <button class="cancel-btn" on:click|stopPropagation|preventDefault={handleCancel}>Cancel</button>
      </div>
    </div>
  {:else}
    <div class="sticky-content">
      <p>{sticky.text}</p>
      <div class="sticky-controls">
        <button class="edit-btn" on:click|stopPropagation|preventDefault={handleEdit} title="Edit">✏️</button>
        <button class="delete-btn" on:click|stopPropagation|preventDefault={handleDelete} title="Delete">🗑️</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .sticky {
    position: relative;
    width: 100%;
    margin: 0;
    padding: 10px;
    border-radius: 2px;
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.15);
    /* Disable transition during drag operations */
    transition: box-shadow 0.2s ease;
    cursor: grab;
    word-break: break-word;
    box-sizing: border-box;
    transform: rotate(var(--rotate, -1deg));
    --rotate: calc(-2deg + (Math.random() * 4deg));
    border-bottom-right-radius: 60px 5px;
    min-height: 70px;
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
    border-width: 0 0 15px 15px;
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
    min-height: 40px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  
  .sticky p {
    margin: 0;
    font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    color: rgba(0, 0, 0, 0.8);
    text-shadow: 0.5px 0.5px 0px rgba(255, 255, 255, 0.5);
  }
  
  .sticky-controls {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
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
    margin-left: 4px;
    padding: 2px;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 26px;
    min-height: 26px;
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
    gap: 8px;
  }
  
  .sticky-edit textarea {
    width: 100%;
    min-height: 60px;
    padding: 6px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 3px;
    resize: vertical;
    font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    background-color: rgba(255, 255, 255, 0.9);
  }
  
  .color-selector {
    display: flex;
    flex-direction: column;
    gap: 6px;
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
  
  .sticky-actions {
    display: flex;
    justify-content: flex-end;
    gap: 5px;
    margin-top: auto;
  }
  
  .cancel-btn, .save-btn {
    padding: 5px 8px;
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
      padding: 8px;
      min-height: 55px;
    }
    
    .sticky p {
      font-size: 13px;
    }
    
    .edit-btn, .delete-btn {
      min-width: 22px;
      min-height: 22px;
      font-size: 13px;
    }
    
    .sticky-edit textarea {
      min-height: 50px;
      font-size: 13px;
    }
    
    .cancel-btn, .save-btn {
      padding: 4px 6px;
      font-size: 11px;
    }
  }
  
  @media (max-width: 480px) {
    .sticky {
      padding: 6px;
      min-height: 50px;
    }
    
    .sticky p {
      font-size: 12px;
      line-height: 1.3;
    }
    
    .edit-btn, .delete-btn {
      min-width: 20px;
      min-height: 20px;
      font-size: 12px;
    }
    
    .sticky-edit textarea {
      min-height: 45px;
      padding: 4px;
    }
    
    .sticky-controls {
      margin-top: 6px;
    }
    
    .color-option {
      width: 18px;
      height: 18px;
    }
  }
</style> 