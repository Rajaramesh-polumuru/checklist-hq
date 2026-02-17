export type ChecklistItem = {
    id: string;
    text: string;
    isChecked: boolean;
    parentId: string | null;
    order: number;
};
export type ChecklistItems = Record<string, ChecklistItem>;
export type ChecklistStore = {
    items: ChecklistItems;
    rootOrder: string[];
    addItem: (parentId: string | null, prevItemId?: string) => void;
    updateItem: (id: string, text: string) => void;
    deleteItem: (id: string) => void;
    indentItem: (id: string) => void;
    outdentItem: (id: string) => void;
    moveItem: (activeId: string, overId: string) => void;
};
//# sourceMappingURL=checklist.d.ts.map