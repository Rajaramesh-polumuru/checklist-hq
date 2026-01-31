import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { ChecklistContent, ChecklistItem } from '@/types/database'

interface ChecklistState {
  // Current checklist content being edited
  content: ChecklistContent
  // Track if there are unsaved changes
  isDirty: boolean
  // Currently focused item ID
  focusedItemId: string | null

  // Actions
  setContent: (content: ChecklistContent) => void
  addItem: (text: string, parentId?: string | null) => string
  updateItem: (id: string, updates: Partial<ChecklistItem>) => void
  deleteItem: (id: string) => void
  moveItem: (id: string, newParentId: string | null, newOrder: number) => void
  indentItem: (id: string) => void
  outdentItem: (id: string) => void
  setFocusedItem: (id: string | null) => void
  resetDirty: () => void

  // Helpers
  getItemsAtLevel: (parentId: string | null) => ChecklistItem[]
  getChildren: (parentId: string) => ChecklistItem[]
  getParent: (id: string) => ChecklistItem | null
  getSiblings: (id: string) => ChecklistItem[]
  getPreviousSibling: (id: string) => ChecklistItem | null
  getNextSibling: (id: string) => ChecklistItem | null
}

const createEmptyContent = (): ChecklistContent => ({
  version: '1.0',
  items: {},
})

export const useChecklistStore = create<ChecklistState>((set, get) => ({
  content: createEmptyContent(),
  isDirty: false,
  focusedItemId: null,

  setContent: (content) => set({ content, isDirty: false }),

  addItem: (text, parentId = null) => {
    const id = uuidv4()
    const siblings = get().getItemsAtLevel(parentId)
    const order = siblings.length // Add at the end

    const newItem: ChecklistItem = {
      id,
      text,
      parent: parentId,
      order,
      type: 'task',
    }

    set((state) => ({
      content: {
        ...state.content,
        items: {
          ...state.content.items,
          [id]: newItem,
        },
      },
      isDirty: true,
      focusedItemId: id,
    }))

    return id
  },

  updateItem: (id, updates) => {
    set((state) => {
      const item = state.content.items[id]
      if (!item) return state

      return {
        content: {
          ...state.content,
          items: {
            ...state.content.items,
            [id]: { ...item, ...updates },
          },
        },
        isDirty: true,
      }
    })
  },

  deleteItem: (id) => {
    set((state) => {
      const item = state.content.items[id]
      if (!item) return state

      // Get all descendants to delete
      const toDelete = new Set<string>([id])
      const findDescendants = (parentId: string) => {
        Object.values(state.content.items).forEach((i) => {
          if (i.parent === parentId) {
            toDelete.add(i.id)
            findDescendants(i.id)
          }
        })
      }
      findDescendants(id)

      // Create new items without deleted ones
      const newItems = { ...state.content.items }
      toDelete.forEach((deleteId) => {
        delete newItems[deleteId]
      })

      // Reorder siblings
      const siblings = Object.values(newItems)
        .filter((i) => i.parent === item.parent)
        .sort((a, b) => a.order - b.order)
      siblings.forEach((sibling, index) => {
        newItems[sibling.id] = { ...sibling, order: index }
      })

      return {
        content: {
          ...state.content,
          items: newItems,
        },
        isDirty: true,
      }
    })
  },

  moveItem: (id, newParentId, newOrder) => {
    set((state) => {
      const item = state.content.items[id]
      if (!item) return state

      const newItems = { ...state.content.items }

      // Remove from old position and reorder old siblings
      const oldSiblings = Object.values(newItems)
        .filter((i) => i.parent === item.parent && i.id !== id)
        .sort((a, b) => a.order - b.order)
      oldSiblings.forEach((sibling, index) => {
        newItems[sibling.id] = { ...sibling, order: index }
      })

      // Insert at new position and reorder new siblings
      const newSiblings = Object.values(newItems)
        .filter((i) => i.parent === newParentId && i.id !== id)
        .sort((a, b) => a.order - b.order)

      // Insert the item at the new position
      newSiblings.splice(newOrder, 0, { ...item, parent: newParentId, order: newOrder })

      // Reorder all items at the new level
      newSiblings.forEach((sibling, index) => {
        newItems[sibling.id] = { ...sibling, order: index }
      })

      newItems[id] = { ...item, parent: newParentId, order: newOrder }

      return {
        content: {
          ...state.content,
          items: newItems,
        },
        isDirty: true,
      }
    })
  },

  indentItem: (id) => {
    const state = get()
    const item = state.content.items[id]
    if (!item) return

    // Find the previous sibling to become the new parent
    const previousSibling = state.getPreviousSibling(id)
    if (!previousSibling) return // Can't indent first item

    // Get the children of the previous sibling to determine new order
    const newSiblings = state.getChildren(previousSibling.id)
    const newOrder = newSiblings.length

    state.moveItem(id, previousSibling.id, newOrder)
  },

  outdentItem: (id) => {
    const state = get()
    const item = state.content.items[id]
    if (!item || !item.parent) return // Can't outdent root items

    const parent = state.getParent(id)
    if (!parent) return

    // Move to parent's level, right after the parent
    const grandparentId = parent.parent
    const parentSiblings = state.getItemsAtLevel(grandparentId)
    const parentIndex = parentSiblings.findIndex((s) => s.id === parent.id)
    const newOrder = parentIndex + 1

    state.moveItem(id, grandparentId, newOrder)
  },

  setFocusedItem: (id) => set({ focusedItemId: id }),

  resetDirty: () => set({ isDirty: false }),

  // Helpers
  getItemsAtLevel: (parentId) => {
    const { content } = get()
    return Object.values(content.items)
      .filter((item) => item.parent === parentId)
      .sort((a, b) => a.order - b.order)
  },

  getChildren: (parentId) => {
    return get().getItemsAtLevel(parentId)
  },

  getParent: (id) => {
    const { content } = get()
    const item = content.items[id]
    if (!item || !item.parent) return null
    return content.items[item.parent] || null
  },

  getSiblings: (id) => {
    const { content } = get()
    const item = content.items[id]
    if (!item) return []
    return get().getItemsAtLevel(item.parent)
  },

  getPreviousSibling: (id) => {
    const siblings = get().getSiblings(id)
    const index = siblings.findIndex((s) => s.id === id)
    if (index <= 0) return null
    return siblings[index - 1]
  },

  getNextSibling: (id) => {
    const siblings = get().getSiblings(id)
    const index = siblings.findIndex((s) => s.id === id)
    if (index === -1 || index >= siblings.length - 1) return null
    return siblings[index + 1]
  },
}))
