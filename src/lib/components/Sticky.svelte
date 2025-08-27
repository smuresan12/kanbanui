<script lang="ts">
  import { createEventDispatcher, onMount, afterUpdate } from 'svelte';
  import type { Sticky } from '../types';
  import { kanbanStore } from '../stores/kanbanStore';
  import { SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { setPointerControls, DEFAULT_DELAY } from 'svelte-gestures';
  
  export let sticky: Sticky;
  export let isEditing = false;

  function doubletap(node, parameters = { timeframe: DEFAULT_DELAY }) {
    const gestureName = 'doubletap';
    
    let startTime;
    let tapCount = 0;
    let timeout;

    function onUp(activeEvents, event) {
      if (
        Date.now() - startTime < parameters.timeframe
      ) {
        if (!tapCount) {
          tapCount++;
        } else {

          node.dispatchEvent(
            new CustomEvent(gestureName, {
            })
          );

          clearTimeout(timeout);
          tapCount = 0;
        }
      }
    }

    function onDown(activeEvents, event) {
      if (!tapCount) {
        startTime = Date.now();
      }

      timeout = setTimeout(() => {
        tapCount = 0;
      }, parameters.timeframe);
    }

    return setPointerControls(gestureName, node, null, onDown, onUp);
  }
  
  // Check if this is a shadow item (being dragged)
  // This checks both for the SHADOW_ITEM_MARKER_PROPERTY_NAME property
  // and ensures we're not treating it as undefined
  $: isDragged = sticky && SHADOW_ITEM_MARKER_PROPERTY_NAME in sticky && 
                 Boolean(sticky[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
  
  let editablePatientName = sticky.patientName;
  let editableNotes = sticky.notes;
  let editableColor = sticky.color;
  let usedColors: string[] = [];
  let editForm: HTMLDivElement;
  let stickyElement: HTMLDivElement;
  let patientNameElement: HTMLHeadingElement;
  let notesElement: HTMLParagraphElement;
  let stickyWidth = 0;
  let contentLength = 0;
  
  // Calculate font size based on content length and width
  $: {
    contentLength = sticky.patientName.length + sticky.notes.length;
  }
  
  // Function to update font size based on sticky width
  function updateFontSize() {
    if (!patientNameElement || !notesElement || !stickyElement) return;
    
    stickyWidth = stickyElement.clientWidth;
    
    // Patient name font size (always larger)
    let patientNameFontSize = Math.max(16, Math.min(20, stickyWidth / 8));
    
    // Notes font size (smaller, based on content length)
    let notesFontSize = 14; // Default size
    
    if (sticky.notes.length > 100) {
      notesFontSize = Math.max(12, Math.min(14, stickyWidth / 18));
    } else if (sticky.notes.length > 50) {
      notesFontSize = Math.max(13, Math.min(15, stickyWidth / 16));
    } else {
      notesFontSize = Math.max(14, Math.min(16, stickyWidth / 14));
    }
    
    patientNameElement.style.fontSize = `${patientNameFontSize}px`;
    notesElement.style.fontSize = `${notesFontSize}px`;
  }
  
  // Update font size after the component is rendered
  afterUpdate(updateFontSize);
  
  // Set up resize observer to update font size when container width changes
  onMount(() => {
    if (typeof window !== 'undefined' && window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(updateFontSize);
      if (stickyElement) {
        resizeObserver.observe(stickyElement);
      }
      
      return () => {
        if (stickyElement) {
          resizeObserver.unobserve(stickyElement);
        }
      };
    }
  });
  
  // Function to determine text color based on background color
  function getContrastColor(hexColor: string): string {
    // Remove the hash if it exists
    const color = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(color.substring(0, 2), 16) || 0;
    const g = parseInt(color.substring(2, 4), 16) || 0;
    const b = parseInt(color.substring(4, 6), 16) || 0;
    
    // Calculate luminance - using the formula for relative luminance
    // See: https://www.w3.org/TR/WCAG20/#relativeluminancedef
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark colors and black for light colors
    return luminance > 0.5 ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  }
  
  // Reactive text color based on background color
  $: textColor = getContrastColor(sticky.color);
  $: editableTextColor = getContrastColor(editableColor);
  
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
    // Use setTimeout to ensure the textarea is rendered
    setTimeout(() => {
      const textarea = editForm?.querySelector('textarea');
      if (textarea) {
        textarea.focus();
      }
    }, 0);
  }
  
  function handleSave() {
    if (editablePatientName.trim()) {
      kanbanStore.updateSticky(sticky.id, {
        patientName: editablePatientName,
        notes: editableNotes,
        color: editableColor
      });
    }
    isEditing = false;
    dispatch('editDone', { id: sticky.id });
  }
  
  function handleCancel() {
    isEditing = false;
    editablePatientName = sticky.patientName;
    editableNotes = sticky.notes;
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
        !editForm.contains(event.target as Node)) {
      
      if (editablePatientName.trim()) {
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
  class:long-text={contentLength > 100}
  class:medium-text={contentLength > 50 && contentLength <= 100}
  class:short-text={contentLength > 20 && contentLength <= 50}
  class:very-short-text={contentLength <= 20}
  bind:this={stickyElement}
  data-is-handle="true"
>
  {#if isEditing}
    <div class="sticky-edit" bind:this={editForm} on:click|stopPropagation>
      <input
        type="text"
        bind:value={editablePatientName}
        on:keydown={handleKeyDown}
        placeholder="Patient name..."
        autoFocus
        class="patient-name-input"
      />
      
      <textarea 
        bind:value={editableNotes}
        on:keydown={handleKeyDown}
        placeholder="Notes about the patient..."
        class="notes-textarea"
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
        <!--
        <div class="color-input">
          <input 
            type="color" 
            bind:value={editableColor}
            id="colorPicker"
          >
          <label for="colorPicker" style="color: {editableTextColor};">Custom</label>
        </div>
      -->
      </div>
      
      <div class="sticky-actions">
        <div class="left-actions">
          <button 
            class="icon-btn cancel-btn" 
            on:click|stopPropagation|preventDefault={handleCancel}
            data-no-dnd="true" 
            title="Cancel">❌</button>
          <button 
            class="icon-btn delete-btn" 
            on:click|stopPropagation|preventDefault={handleDelete} 
            data-no-dnd="true"
            title="Delete">🗑️</button>
        </div>
        <div class="right-actions">
          <button 
            class="icon-btn save-btn" 
            on:click|stopPropagation|preventDefault={handleSave}
            data-no-dnd="true"
            title="Save">💾</button>
        </div>
      </div>
    </div>
  {:else}
    <div 
      class="sticky-content" 
      on:dblclick|stopPropagation|preventDefault={handleEdit}
      use:doubletap
	    on:doubletap={handleEdit}
      role="button" 
      tabindex="0"
      aria-label="Edit sticky note"
    >
      <h3 class="patient-name" style="color: {textColor};" bind:this={patientNameElement}>
        {sticky.patientName}
      </h3>
      {#if sticky.notes.trim()}
        <p class="patient-notes" style="color: {textColor};" bind:this={notesElement}>
          {sticky.notes}
        </p>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Define responsive font size variables */
  :root {
    --font-size-xs: clamp(12px, 0.8rem, 14px);
    --font-size-small: clamp(14px, 0.9rem, 16px);
    --font-size-medium: clamp(16px, 1.1rem, 18px);
    --font-size-large: clamp(18px, 1.2rem, 20px);
  }

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
    min-height: 90px;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    border-top: 3px solid rgba(0, 0, 0, 0.1);
  }
  
  /* Font size controlled by JavaScript for better width-based scaling */
  .sticky p {
    margin: 0;
    font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.4;
    text-shadow: none;
    width: 100%;
    box-sizing: border-box;
    transition: color 0.2s ease;
    font-weight: 600;
    text-align: center;
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

  /* Prevent hover effects during drag */
  .sticky.is-dragged:hover,
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
    min-height: 60px;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    padding: 4px;
    gap: 4px;
  }
  
  .patient-name {
    margin: 0 0 8px 0;
    font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.3;
    text-shadow: none;
    width: 100%;
    box-sizing: border-box;
    transition: color 0.2s ease;
    font-weight: 700;
    text-align: center;
    border-bottom: 2px solid rgba(0, 0, 0, 0.15);
    padding-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 16px;
  }
  
  .patient-notes {
    margin: 8px 0 0 0;
    font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.4;
    text-shadow: none;
    width: 100%;
    box-sizing: border-box;
    transition: color 0.2s ease;
    font-weight: 400;
    text-align: left;
    font-style: normal;
    font-size: 14px;
    padding: 8px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    border-left: 3px solid rgba(0, 0, 0, 0.2);
    min-height: 20px;
  }
  
 .delete-btn {
    background: none;
    border: none;
    cursor: pointer;
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
    z-index: 2;
  }
  
 .delete-btn:hover {
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
  
  .patient-name-input {
    width: 100%;
    padding: 6px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 3px;
    font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    font-weight: 600;
    background-color: white;
    color: black;
    margin-bottom: 4px;
    border-left: 4px solid #4a69bd;
  }
  
  .patient-name-input:focus {
    outline: none;
    border-color: #4a69bd;
    box-shadow: 0 0 0 2px rgba(74, 105, 189, 0.2);
    border-left-color: #2c4aa6;
  }
  
  .notes-textarea {
    width: 100%;
    min-height: 60px;
    padding: 6px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 3px;
    resize: vertical;
    font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    background-color: white;
    color: black;
    border-left: 4px solid #50aec7;
  }
  
  .notes-textarea:focus {
    outline: none;
    border-color: #4a69bd;
    box-shadow: 0 0 0 2px rgba(74, 105, 189, 0.2);
    border-left-color: #2c4aa6;
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
    justify-content: space-between;
    gap: 5px;
    margin-top: auto;
  }
  
  .left-actions {
    display: flex;
    gap: 4px;
  }
  
  .right-actions {
    display: flex;
    gap: 4px;
  }
  
  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
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
    z-index: 2;
  }
  
  .icon-btn:hover {
    background-color: rgba(255, 255, 255, 0.6);
    transform: scale(1.1);
  }
  
  /* Mobile-specific adjustments */
  @media (max-width: 768px) {
    :root {
      --font-size-xs: clamp(11px, 0.75rem, 13px);
      --font-size-small: clamp(12px, 0.85rem, 14px);
      --font-size-medium: clamp(14px, 0.95rem, 16px);
      --font-size-large: clamp(16px, 1.05rem, 18px);
    }
    
    .sticky {
      padding: 8px;
      min-height: 75px;
    }
    
    .patient-name {
      font-size: min(16px, 4.5cqw);
      margin-bottom: 6px;
      padding-bottom: 4px;
    }
    
    .patient-notes {
      font-size: min(13px, 3.5cqw);
      padding: 6px;
      margin-top: 6px;
    }
    
    .delete-btn {
      min-width: 22px;
      min-height: 22px;
      font-size: 13px;
    }
    
    .notes-textarea {
      min-height: 50px;
      font-size: 13px;
    }
    
    .patient-name-input {
      font-size: 13px;
    }
    
    .cancel-btn {
      padding: 4px 6px;
      font-size: 11px;
    }
  }
  
  @media (max-width: 480px) {
    :root {
      --font-size-xs: clamp(10px, 0.7rem, 12px);
      --font-size-small: clamp(11px, 0.8rem, 13px);
      --font-size-medium: clamp(12px, 0.9rem, 14px);
      --font-size-large: clamp(14px, 1rem, 16px);
    }
    
    .sticky {
      padding: 6px;
      min-height: 65px;
    }
    
    .patient-name {
      font-size: min(14px, 4cqw);
      margin-bottom: 4px;
      padding-bottom: 3px;
    }
    
    .patient-notes {
      font-size: min(12px, 3.5cqw);
      padding: 4px;
      margin-top: 4px;
    }
    
    .delete-btn {
      min-width: 20px;
      min-height: 20px;
      font-size: 12px;
    }
    
    .notes-textarea {
      min-height: 45px;
      padding: 4px;
    }
    
    .patient-name-input {
      padding: 4px;
      font-size: 12px;
    }
    
    .color-option {
      width: 18px;
      height: 18px;
    }
  }
</style>