<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { kanbanStore } from '../stores/kanbanStore';
  import type { Sticky } from '../types';
  
  export let oldStickies: Sticky[] = [];
  
  const dispatch = createEventDispatcher<{
    confirm: void;
    cancel: void;
  }>();
  
  function handleConfirm() {
    kanbanStore.deleteOldDoneStickies();
    dispatch('confirm');
  }
  
  function handleCancel() {
    dispatch('cancel');
  }
</script>

<div class="modal-overlay">
  <div class="modal">
    <h2>Clean Up Old Stickies</h2>
    <p>
      You have {oldStickies.length} {oldStickies.length === 1 ? 'sticky' : 'stickies'} in the "Done" column 
      that are older than 100 days. Would you like to delete them?
    </p>
    
    {#if oldStickies.length > 0}
      <div class="stickies-list">
        <h3>Stickies to be deleted:</h3>
        <ul>
          {#each oldStickies as sticky}
            <li style="background-color: {sticky.color};">
              {sticky.text}
              <small>Created: {new Date(sticky.createdAt).toLocaleDateString()}</small>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
    
    <div class="modal-actions">
      <button class="cancel-btn" on:click={handleCancel}>
        Keep them
      </button>
      <button class="confirm-btn" on:click={handleConfirm}>
        Yes, delete them
      </button>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal {
    background-color: white;
    border-radius: 5px;
    padding: 20px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }
  
  h2 {
    margin-top: 0;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  }
  
  .stickies-list {
    max-height: 200px;
    overflow-y: auto;
    margin: 15px 0;
    padding: 10px;
    border: 1px solid #eee;
    border-radius: 4px;
  }
  
  h3 {
    margin-top: 0;
    font-size: 16px;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  li {
    padding: 8px 12px;
    margin-bottom: 8px;
    border-radius: 3px;
    display: flex;
    flex-direction: column;
    font-family: 'Comic Sans MS', cursive, sans-serif;
  }
  
  small {
    font-size: 12px;
    opacity: 0.7;
    margin-top: 5px;
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }
  
  .confirm-btn, .cancel-btn {
    padding: 8px 15px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-weight: 500;
  }
  
  .confirm-btn {
    background-color: #f44336;
    color: white;
  }
  
  .cancel-btn {
    background-color: #e0e0e0;
    color: #333;
  }
</style> 