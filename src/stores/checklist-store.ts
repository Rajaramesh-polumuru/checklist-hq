import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ChecklistContent, ChecklistItem as ChecklistItemType } from '../types/database';

interface HistoryEntry {
  content: ChecklistContent;
  timestamp: number;
}

interface ChecklistStore {
  content: ChecklistContent;
  isDirty: boolean;
  focusedItemId: string | null;

  // Undo/Redo
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];

  // Actions
  setContent: (content: ChecklistContent) => void;
  resetDirty: () => void;
  setFocusedItem: (id: string | null) => void;

  addItem: (text: string, parentId?: string | null) => void;
  updateItem: (id: string, updates: Partial<ChecklistItemType>) => void;
  deleteItem: (id: string) => void;
  duplicateItem: (id: string) => void;
  moveItemUp: (id: string) => void;
  moveItemDown: (id: string) => void;

  indentItem: (id: string) => void;
  outdentItem: (id: string) => void;
  moveItem: (activeId: string, parentId: string | null, order: number) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Selectors/Helpers
  getItemsAtLevel: (parentId: string | null) => ChecklistItemType[];
  getParent: (id: string) => ChecklistItemType | null;
  getPreviousSibling: (id: string) => ChecklistItemType | null;
  getNextSibling: (id: string) => ChecklistItemType | null;
  getItemCount: () => number;
  getFilledItemCount: () => number;
}

const MAX_HISTORY = 50;

// Helper to save state to history
const saveToHistory = (state: ChecklistStore): Partial<ChecklistStore> => {
  const entry: HistoryEntry = {
    content: JSON.parse(JSON.stringify(state.content)),
    timestamp: Date.now(),
  };
  return {
    undoStack: [...state.undoStack.slice(-MAX_HISTORY + 1), entry],
    redoStack: [], // Clear redo on new action
  };
};

export const useChecklistStore = create<ChecklistStore>((set, get) => ({
  content: {
    version: '1.0',
    items: {},
  },
  isDirty: false,
  focusedItemId: null,
  undoStack: [],
  redoStack: [],

  setContent: (content) => set({ content, isDirty: false, undoStack: [], redoStack: [] }),
  resetDirty: () => set({ isDirty: false }),
  setFocusedItem: (id) => set({ focusedItemId: id }),

  getItemsAtLevel: (parentId) => {
    const items = get().content.items;
    return Object.values(items)
      .filter((item) => item.parent === (parentId || null))
      .sort((a, b) => a.order - b.order);
  },

  getParent: (id) => {
    const items = get().content.items;
    const item = items[id];
    if (!item || !item.parent) return null;
    return items[item.parent];
  },

  getPreviousSibling: (id) => {
    const items = get().content.items;
    const item = items[id];
    if (!item) return null;

    const siblings = Object.values(items)
      .filter((i) => i.parent === item.parent)
      .sort((a, b) => a.order - b.order);

    const index = siblings.findIndex((s) => s.id === id);
    if (index > 0) return siblings[index - 1];
    return null;
  },

  getNextSibling: (id) => {
    const items = get().content.items;
    const item = items[id];
    if (!item) return null;

    const siblings = Object.values(items)
      .filter((i) => i.parent === item.parent)
      .sort((a, b) => a.order - b.order);

    const index = siblings.findIndex((s) => s.id === id);
    if (index < siblings.length - 1) return siblings[index + 1];
    return null;
  },

  getItemCount: () => Object.keys(get().content.items).length,

  getFilledItemCount: () => Object.values(get().content.items).filter(i => i.text.trim() !== '').length,

  addItem: (text, parentId = null) => {
    const newItemId = uuidv4();
    set((state) => {
      const items = state.content.items;
      const siblings = Object.values(items).filter((i) => i.parent === parentId);

      const newItem: ChecklistItemType = {
        id: newItemId,
        text,
        parent: parentId,
        order: siblings.length,
      };

      return {
        ...saveToHistory(state),
        content: {
          ...state.content,
          items: {
            ...items,
            [newItemId]: newItem,
          },
        },
        isDirty: true,
        focusedItemId: newItemId,
      };
    });
  },

  updateItem: (id, updates) => {
    set((state) => ({
      content: {
        ...state.content,
        items: {
          ...state.content.items,
          [id]: { ...state.content.items[id], ...updates },
        },
      },
      isDirty: true,
    }));
  },

  deleteItem: (id) => {
    set((state) => {
      const newItems = { ...state.content.items };
      delete newItems[id];

      const deleteRecursive = (itemId: string) => {
        const children = Object.values(state.content.items).filter(i => i.parent === itemId);
        children.forEach(c => {
          delete newItems[c.id];
          deleteRecursive(c.id);
        });
      };
      deleteRecursive(id);

      return {
        ...saveToHistory(state),
        content: { ...state.content, items: newItems },
        isDirty: true,
      };
    });
  },

  duplicateItem: (id) => {
    const items = get().content.items;
    const item = items[id];
    if (!item) return;

    const newItemId = uuidv4();
    const siblings = get().getItemsAtLevel(item.parent);

    set((state) => {
      // Shift orders of siblings after the current item
      const updatedItems = { ...state.content.items };
      siblings.forEach(s => {
        if (s.order > item.order) {
          updatedItems[s.id] = { ...s, order: s.order + 1 };
        }
      });

      const newItem: ChecklistItemType = {
        id: newItemId,
        text: item.text,
        parent: item.parent,
        order: item.order + 1,
      };

      return {
        ...saveToHistory(state),
        content: {
          ...state.content,
          items: {
            ...updatedItems,
            [newItemId]: newItem,
          },
        },
        isDirty: true,
        focusedItemId: newItemId,
      };
    });
  },

  moveItemUp: (id) => {
    const items = get().content.items;
    const item = items[id];
    const prevSibling = get().getPreviousSibling(id);

    if (!prevSibling) return;

    set((state) => ({
      ...saveToHistory(state),
      content: {
        ...state.content,
        items: {
          ...state.content.items,
          [id]: { ...item, order: prevSibling.order },
          [prevSibling.id]: { ...prevSibling, order: item.order },
        },
      },
      isDirty: true,
    }));
  },

  moveItemDown: (id) => {
    const items = get().content.items;
    const item = items[id];
    const nextSibling = get().getNextSibling(id);

    if (!nextSibling) return;

    set((state) => ({
      ...saveToHistory(state),
      content: {
        ...state.content,
        items: {
          ...state.content.items,
          [id]: { ...item, order: nextSibling.order },
          [nextSibling.id]: { ...nextSibling, order: item.order },
        },
      },
      isDirty: true,
    }));
  },

  indentItem: (id) => {
    const items = get().content.items;
    const item = items[id];
    const prevSibling = get().getPreviousSibling(id);

    if (prevSibling) {
      const newParentId = prevSibling.id;
      const newParentChildren = get().getItemsAtLevel(newParentId);

      set((state) => ({
        ...saveToHistory(state),
        content: {
          ...state.content,
          items: {
            ...state.content.items,
            [id]: {
              ...item,
              parent: newParentId,
              order: newParentChildren.length,
            },
          },
        },
        isDirty: true,
      }));
    }
  },

  outdentItem: (id) => {
    const items = get().content.items;
    const item = items[id];

    if (item.parent) {
      const parent = items[item.parent];
      const grandparent = parent.parent;
      const newSiblings = get().getItemsAtLevel(grandparent || null);

      set((state) => ({
        ...saveToHistory(state),
        content: {
          ...state.content,
          items: {
            ...state.content.items,
            [id]: {
              ...item,
              parent: grandparent || null,
              order: newSiblings.length,
            },
          },
        },
        isDirty: true,
      }));
    }
  },

  moveItem: (activeId, newParentId, targetOrder) => {
    set((state) => {
      const items = state.content.items;
      const activeItem = items[activeId];

      if (!activeItem) return state;

      const oldParentId = activeItem.parent;
      const newItems = { ...items };

      // If moving within the same parent
      if (oldParentId === newParentId) {
        // Get all siblings (including the active item)
        const siblings = Object.values(newItems)
          .filter((item) => item.parent === newParentId)
          .sort((a, b) => a.order - b.order);

        // Remove the active item from its current position
        const oldIndex = siblings.findIndex((s) => s.id === activeId);
        if (oldIndex !== -1) {
          siblings.splice(oldIndex, 1);
        }

        // Calculate new index (adjust for removal if moving down)
        let newIndex = targetOrder;
        if (oldIndex < targetOrder) {
          newIndex = Math.max(0, targetOrder - 1);
        }
        newIndex = Math.min(newIndex, siblings.length);

        // Insert at new position
        siblings.splice(newIndex, 0, activeItem);

        // Reassign orders to all siblings
        siblings.forEach((sibling, index) => {
          newItems[sibling.id] = { ...newItems[sibling.id], order: index };
        });
      } else {
        // Moving to a different parent

        // 1. Update orders in the old parent (close the gap)
        const oldSiblings = Object.values(newItems)
          .filter((item) => item.parent === oldParentId && item.id !== activeId)
          .sort((a, b) => a.order - b.order);

        oldSiblings.forEach((sibling, index) => {
          newItems[sibling.id] = { ...newItems[sibling.id], order: index };
        });

        // 2. Insert into new parent at the target position
        const newSiblings = Object.values(newItems)
          .filter((item) => item.parent === newParentId)
          .sort((a, b) => a.order - b.order);

        const insertIndex = Math.min(targetOrder, newSiblings.length);

        // Shift items at and after insert position
        newSiblings.forEach((sibling, index) => {
          if (index >= insertIndex) {
            newItems[sibling.id] = { ...newItems[sibling.id], order: index + 1 };
          }
        });

        // Update the active item with new parent and order
        newItems[activeId] = {
          ...activeItem,
          parent: newParentId,
          order: insertIndex,
        };
      }

      return {
        ...saveToHistory(state),
        content: { ...state.content, items: newItems },
        isDirty: true,
      };
    });
  },

  undo: () => {
    const { undoStack, content } = get();
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];

    set((state) => ({
      content: previousState.content,
      undoStack: undoStack.slice(0, -1),
      redoStack: [
        ...state.redoStack,
        { content: JSON.parse(JSON.stringify(content)), timestamp: Date.now() }
      ],
      isDirty: true,
    }));
  },

  redo: () => {
    const { redoStack, content } = get();
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];

    set((state) => ({
      content: nextState.content,
      redoStack: redoStack.slice(0, -1),
      undoStack: [
        ...state.undoStack,
        { content: JSON.parse(JSON.stringify(content)), timestamp: Date.now() }
      ],
      isDirty: true,
    }));
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,
}));
