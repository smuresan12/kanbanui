import { writable } from 'svelte/store';
import type { KanbanState, Sticky, Column } from '../types';

// Initial state
const defaultState: KanbanState = {
  stickies: [],
  usedColors: ['#ffcc00', '#ff9900', '#ff6666', '#99cc66', '#66cccc', '#6699cc']
};

// IndexedDB configuration
const DB_NAME = 'kanban-db';
const DB_VERSION = 1;
const STORE_NAME = 'kanban-state';
const KEY = 'state';

// Open IndexedDB connection
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

// Save state to IndexedDB
const saveState = async (state: KanbanState): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.put(state, KEY);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve();
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to save to IndexedDB', error);
    // Fallback to localStorage if IndexedDB fails
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('kanban-state', JSON.stringify(state));
    }
  }
};

// Load state from IndexedDB
const loadState = async (): Promise<KanbanState> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(KEY);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          // No data found in IndexedDB
          resolve(defaultState);
        }
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to load from IndexedDB', error);
    // Fallback to localStorage if IndexedDB fails
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('kanban-state');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved state', e);
        }
      }
    }
    return defaultState;
  }
};

// Create the store
const createKanbanStore = () => {
  // Initialize with defaultState first, then async update when data is loaded
  const { subscribe, set, update } = writable<KanbanState>(defaultState);
  
  // Load state from IndexedDB when browser is available
  if (typeof window !== 'undefined') {
    loadState().then(state => {
      set(state);
    }).catch(error => {
      console.error('Error loading initial state', error);
    });
  }
  
  return {
    subscribe,
    
    // Add a new sticky
    addSticky: (text: string, color: string, column: Column) => {
      update(state => {
        const newSticky: Sticky = {
          id: crypto.randomUUID(),
          text,
          color,
          column,
          createdAt: new Date().toISOString()
        };
        
        const newState = {
          ...state,
          stickies: [...state.stickies, newSticky]
        };
        
        // Add color to usedColors if not already there
        if (!state.usedColors.includes(color)) {
          newState.usedColors = [...state.usedColors, color];
        }
        
        // Save to IndexedDB
        saveState(newState).catch(err => console.error('Error saving new sticky', err));
        return newState;
      });
    },
    
    // Update a sticky
    updateSticky: (id: string, updates: Partial<Omit<Sticky, 'id' | 'createdAt'>>) => {
      update(state => {
        const updatedStickies = state.stickies.map(sticky => {
          if (sticky.id === id) {
            // Create a new sticky with the updates applied
            const updatedSticky: Sticky = { ...sticky };
            // Apply each update in a type-safe way
            if (typeof updates.text === 'string') updatedSticky.text = updates.text;
            if (typeof updates.color === 'string') updatedSticky.color = updates.color;
            if (updates.column && 
                (updates.column === 'Backlog' || 
                 updates.column === 'To Do' || 
                 updates.column === 'In Progress' || 
                 updates.column === 'Done')) {
              updatedSticky.column = updates.column;
            }
            
            // Apply any other properties that match the index signature
            Object.entries(updates).forEach(([key, value]) => {
              if (key !== 'text' && key !== 'color' && key !== 'column') {
                if (typeof value === 'string' || typeof value === 'boolean') {
                  updatedSticky[key] = value;
                }
              }
            });
            
            return updatedSticky;
          }
          return sticky;
        });
        
        const newState = { ...state, stickies: updatedStickies };
        
        // Update usedColors if color has changed
        if (updates.color && typeof updates.color === 'string' && !state.usedColors.includes(updates.color)) {
          newState.usedColors = [...state.usedColors, updates.color];
        }
        
        // Save to IndexedDB
        saveState(newState).catch(err => console.error('Error updating sticky', err));
        return newState;
      });
    },
    
    // Delete a sticky
    deleteSticky: (id: string) => {
      update(state => {
        const newState = {
          ...state,
          stickies: state.stickies.filter(sticky => sticky.id !== id)
        };
        
        // Save to IndexedDB
        saveState(newState).catch(err => console.error('Error deleting sticky', err));
        return newState;
      });
    },
    
    // Move a sticky to a different column
    moveSticky: (id: string, toColumn: Column) => {
      update(state => {
        const updatedStickies = state.stickies.map(sticky => 
          sticky.id === id ? { ...sticky, column: toColumn } : sticky
        );
        
        const newState = { ...state, stickies: updatedStickies };
        
        // Save to IndexedDB
        saveState(newState).catch(err => console.error('Error moving sticky', err));
        return newState;
      });
    },
    
    // Reorder a sticky within the same column
    reorderSticky: (draggedId: string, targetId: string, insertBefore: boolean = false) => {
      update(state => {
        // Find the sticky being dragged and the target sticky
        const draggedSticky = state.stickies.find(s => s.id === draggedId);
        const targetSticky = state.stickies.find(s => s.id === targetId);
        
        // If either sticky doesn't exist or they're not in the same column, do nothing
        if (!draggedSticky || !targetSticky || draggedSticky.column !== targetSticky.column) {
          return state;
        }
        
        // Get stickies without the dragged sticky
        const stickiesWithoutDragged = state.stickies.filter(s => s.id !== draggedId);
        
        // Find the index where the target sticky is
        const targetIndex = stickiesWithoutDragged.findIndex(s => s.id === targetId);
        
        // Create a new array with the dragged sticky inserted at the correct position
        let reorderedStickies;
        if (insertBefore) {
          // Insert before the target
          reorderedStickies = [
            ...stickiesWithoutDragged.slice(0, targetIndex),
            draggedSticky,
            ...stickiesWithoutDragged.slice(targetIndex)
          ];
        } else {
          // Insert after the target (default behavior)
          reorderedStickies = [
            ...stickiesWithoutDragged.slice(0, targetIndex + 1),
            draggedSticky,
            ...stickiesWithoutDragged.slice(targetIndex + 1)
          ];
        }
        
        const newState = { ...state, stickies: reorderedStickies };
        
        // Save to IndexedDB
        saveState(newState).catch(err => console.error('Error reordering sticky', err));
        return newState;
      });
    },
    
    // Reorder column with the list of stickies from the UI
    reorderColumn: (column: Column, columnStickies: Sticky[]) => {
      update(state => {
        // Get all stickies that are NOT in this column
        const otherColumnStickies = state.stickies.filter(s => s.column !== column);
        
        // Combine the other column stickies with the reordered stickies for this column
        const newStickies = [...otherColumnStickies, ...columnStickies];
        
        const newState = { ...state, stickies: newStickies };
        
        // Save to IndexedDB
        saveState(newState).catch(err => console.error('Error reordering column', err));
        return newState;
      });
    },
    
    // Check for old stickies in the Done column (older than 100 days)
    getOldDoneStickies: async () => {
      const state = await loadState();
      const now = new Date();
      const hundredDaysAgo = new Date(now.setDate(now.getDate() - 100));
      
      return state.stickies.filter(sticky => {
        return (
          sticky.column === 'Done' && 
          new Date(sticky.createdAt) < hundredDaysAgo
        );
      });
    },
    
    // Delete old stickies from Done column
    deleteOldDoneStickies: () => {
      update(state => {
        const now = new Date();
        const hundredDaysAgo = new Date(now.setDate(now.getDate() - 100));
        
        const newStickies = state.stickies.filter(sticky => {
          // Keep if not in Done column or if not old
          return (
            sticky.column !== 'Done' || 
            new Date(sticky.createdAt) >= hundredDaysAgo
          );
        });
        
        const newState = { ...state, stickies: newStickies };
        
        // Save to IndexedDB
        saveState(newState).catch(err => console.error('Error deleting old done stickies', err));
        return newState;
      });
    }
  };
};

export const kanbanStore = createKanbanStore(); 