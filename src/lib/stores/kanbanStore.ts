import { writable } from 'svelte/store';
import type { KanbanState, Sticky, Column } from '../types';

// Initial state
const defaultState: KanbanState = {
  stickies: [],
  usedColors: ['#ffcc00', '#ff9900', '#ff6666', '#99cc66', '#66cccc', '#6699cc']
};

// Create a function to load data from localStorage
const loadState = (): KanbanState => {
  if (typeof localStorage === 'undefined') {
    return defaultState;
  }
  
  const saved = localStorage.getItem('kanban-state');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved state', e);
    }
  }
  return defaultState;
};

// Create the store
const createKanbanStore = () => {
  // Initialize with data from localStorage if available
  const { subscribe, set, update } = writable<KanbanState>(defaultState);
  
  // Load state when browser is available
  if (typeof window !== 'undefined') {
    set(loadState());
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
        
        // Save to localStorage
        localStorage.setItem('kanban-state', JSON.stringify(newState));
        return newState;
      });
    },
    
    // Update a sticky
    updateSticky: (id: string, updates: Partial<Omit<Sticky, 'id' | 'createdAt'>>) => {
      update(state => {
        const updatedStickies = state.stickies.map(sticky => 
          sticky.id === id ? { ...sticky, ...updates } : sticky
        );
        
        const newState = { ...state, stickies: updatedStickies };
        
        // Update usedColors if color has changed
        if (updates.color && !state.usedColors.includes(updates.color)) {
          newState.usedColors = [...state.usedColors, updates.color];
        }
        
        // Save to localStorage
        localStorage.setItem('kanban-state', JSON.stringify(newState));
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
        
        // Save to localStorage
        localStorage.setItem('kanban-state', JSON.stringify(newState));
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
        
        // Save to localStorage
        localStorage.setItem('kanban-state', JSON.stringify(newState));
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
        
        // Save to localStorage
        localStorage.setItem('kanban-state', JSON.stringify(newState));
        return newState;
      });
    },
    
    // Check for old stickies in the Done column (older than 100 days)
    getOldDoneStickies: () => {
      const state = loadState();
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
        
        // Save to localStorage
        localStorage.setItem('kanban-state', JSON.stringify(newState));
        return newState;
      });
    }
  };
};

export const kanbanStore = createKanbanStore(); 