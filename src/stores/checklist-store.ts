import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ChecklistContent, ChecklistItem as ChecklistItemType } from '../types/database';

interface ChecklistStore {
  content: ChecklistContent;
  isDirty: boolean;
  focusedItemId: string | null;

  // Actions
  setContent: (content: ChecklistContent) => void;
  resetDirty: () => void;
  setFocusedItem: (id: string | null) => void;

  addItem: (text: string, parentId?: string | null) => void;
  updateItem: (id: string, updates: Partial<ChecklistItemType>) => void;
  deleteItem: (id: string) => void;

  indentItem: (id: string) => void;
  outdentItem: (id: string) => void;
  moveItem: (activeId: string, parentId: string | null, order: number) => void;

  // Selectors/Helpers
  getItemsAtLevel: (parentId: string | null) => ChecklistItemType[];
  getParent: (id: string) => ChecklistItemType | null;
  getPreviousSibling: (id: string) => ChecklistItemType | null;
}

export const useChecklistStore = create<ChecklistStore>((set, get) => ({
  content: {
    version: '1.0',
    items: {},
  },
  isDirty: false,
  focusedItemId: null,

  setContent: (content) => set({ content, isDirty: false }),
  resetDirty: () => set({ isDirty: false }),
  setFocusedItem: (id) => set({ focusedItemId: id }),

  getItemsAtLevel: (parentId) => {
    const items = get().content.items;
    return Object.values(items)
      .filter((item) => item.parent === (parentId || null)) // Handle 'null' vs undefined
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

  addItem: (text, parentId = null) => {
    const newItemId = uuidv4();
    set((state) => {
      const items = state.content.items;
      const siblings = Object.values(items).filter((i) => i.parent === parentId);

      const newItem: ChecklistItemType = {
        id: newItemId,
        text,
        parent: parentId,
        order: siblings.length, // Append to end
      };

      return {
        content: {
          ...state.content,
          items: {
            ...items,
            [newItemId]: newItem,
          },
        },
        isDirty: true,
        focusedItemId: newItemId, // Focus new item
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
      // Also delete children? Or promote them?
      // For MVP, recursive delete is safer to avoid orphans
      const deleteRecursive = (itemId: string) => {
        const children = Object.values(state.content.items).filter(i => i.parent === itemId);
        children.forEach(c => {
          delete newItems[c.id];
          deleteRecursive(c.id);
        });
      };
      deleteRecursive(id);

      return {
        content: { ...state.content, items: newItems },
        isDirty: true,
      };
    });
  },

  indentItem: (id) => {
    const items = get().content.items;
    const item = items[id];
    const prevSibling = get().getPreviousSibling(id);

    if (prevSibling) {
      // Become child of previous sibling
      const newParentId = prevSibling.id;
      const newParentChildren = get().getItemsAtLevel(newParentId);

      set((state) => ({
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
      const grandparent = parent.parent; // can be null

      // We need to insert after the parent in the grandparent's list
      // This requires shifting orders of subsequent items, but for MVP appending is safest?
      // Or we can try to be smart.
      // Let's just append to grandparent for now to avoid order collision logic complexity in MVP.
      // Ideally we should use fractional indexing or re-sort.

      const newSiblings = get().getItemsAtLevel(grandparent || null);

      set((state) => ({
        content: {
          ...state.content,
          items: {
            ...state.content.items,
            [id]: {
              ...item,
              parent: grandparent || null,
              order: newSiblings.length, // Append to end of new level
            },
          },
        },
        isDirty: true,
      }));
    }
  },

  moveItem: (activeId, parentId, order) => {
    set((state) => ({
      content: {
        ...state.content,
        items: {
          ...state.content.items,
          [activeId]: {
            ...state.content.items[activeId],
            parent: parentId,
            order: order, // Note: In a real app we need to shift others, but dnd-kit sortable might handle visual order.
            // Ideally we need to re-index the whole list at that level.
          },
        },
      },
      isDirty: true,
    }));
  }
}));
