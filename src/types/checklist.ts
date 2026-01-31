export type ChecklistItem = {
    id: string;
    text: string;
    isChecked: boolean; // For local optimistic updates in UI only? Or is this separate?
    // Actually, for the *Editor* (repo definition), isChecked is irrelevant.
    // But for the *Runner*, it matters. 
    // For the MVP Editor, we just need text and hierarchy.
    parentId: string | null;
    order: number;
};

// The flat map structure for O(1) lookups
export type ChecklistItems = Record<string, ChecklistItem>;

export type ChecklistStore = {
    items: ChecklistItems;
    rootOrder: string[]; // Array of IDs at the top level? 
    // actually, we can derive order from the 'order' field, 
    // but a sorted array of IDs is easier for dnd-kit.
    // Let's stick to the mapped structure + a getter for sorted items.

    // Actions
    addItem: (parentId: string | null, prevItemId?: string) => void;
    updateItem: (id: string, text: string) => void;
    deleteItem: (id: string) => void;
    indentItem: (id: string) => void;
    outdentItem: (id: string) => void;
    moveItem: (activeId: string, overId: string) => void;
};
