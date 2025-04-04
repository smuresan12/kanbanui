<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { kanbanStore } from '../stores/kanbanStore';
  
  export let show = false;
  export let lastBackupDate: string | null = null;
  
  const dispatch = createEventDispatcher();
  
  // Format the last backup date
  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Unknown date';
      }
      
      // Format it as a readable date
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Unknown date';
    }
  }
  
  // Function to download the backup
  async function downloadBackup() {
    try {
      const stateBlob = await kanbanStore.exportState();
      
      // Create a download link and trigger it
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(stateBlob);
      
      // Get current date for the filename
      const now = new Date();
      const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      downloadLink.download = `kanban-backup-${dateString}.json`;
      
      // Add to document, click and remove
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      dispatch('complete');
    } catch (error) {
      console.error('Error creating backup', error);
    }
  }
  
  // Skip backup this time
  function skipBackup() {
    dispatch('complete');
  }
  
  // Disable backups permanently
  function disableBackups() {
    kanbanStore.disableBackupReminders();
    dispatch('complete');
  }
</script>

{#if show}
  <div class="modal-backdrop" 
    on:click={skipBackup}
    on:touchend={skipBackup}>
    <div class="modal" 
      on:click|stopPropagation
      on:touchend|stopPropagation>
      <div class="modal-header">
        <h2>Backup Reminder</h2>
      </div>
      <div class="modal-content">
        <p>It's recommended to back up your data weekly. Would you like to create a backup now?</p>
        
        {#if lastBackupDate}
          <p class="backup-date">Last backup: {formatDate(lastBackupDate)}</p>
        {:else}
          <p class="backup-date">No previous backups found</p>
        {/if}
      </div>
      <div class="modal-footer">
        <button class="text-button" on:click={disableBackups}>Never Show</button>
        <div class="spacer"></div>
        <button class="secondary" on:click={skipBackup}>Skip</button>
        <button class="primary" on:click={downloadBackup}>Download Backup</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 450px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    overflow: hidden;
  }
  
  .modal-header {
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
  }
  
  .modal-content {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }
  
  .modal-content p {
    margin: 0 0 16px;
    line-height: 1.5;
  }
  
  .backup-date {
    font-size: 0.9rem;
    color: #666;
    font-style: italic;
    margin-top: -8px;
  }
  
  .modal-footer {
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-top: 1px solid #eee;
  }
  
  .spacer {
    flex: 1;
  }
  
  button {
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, box-shadow 0.2s;
    border: none;
  }
  
  .text-button {
    background: none;
    padding: 8px 0;
    color: #666;
    text-decoration: underline;
  }
  
  .text-button:hover {
    color: #333;
  }
  
  .secondary {
    background-color: #f5f5f5;
    color: #333;
  }
  
  .secondary:hover {
    background-color: #e5e5e5;
  }
  
  .primary {
    background-color: #4a69bd;
    color: white;
  }
  
  .primary:hover {
    background-color: #3c5aa6;
  }
  
  @media (max-width: 480px) {
    .modal {
      width: 95%;
    }
    
    .modal-header,
    .modal-content,
    .modal-footer {
      padding: 12px 16px;
    }
  }
</style> 