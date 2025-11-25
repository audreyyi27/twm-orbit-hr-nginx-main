// stores/useDataTableStore.ts
import { OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import { create } from "zustand";

export type Row = Record<string, unknown>;

interface TableStore {
  rowSelection: RowSelectionState;
  setRowSelection: OnChangeFn<RowSelectionState>;
  clearSelected: () => void;

  data: Row[];
  setData: (updater: Row[] | ((prev: Row[]) => Row[])) => void;
  addRow: (row: Row) => void;
  clearData: () => void;
}

export const useTableStore = create<TableStore>((set) => ({
  rowSelection: {},
  setRowSelection: (updaterOrValue) =>
    set((state) => ({
      rowSelection:
        typeof updaterOrValue === "function"
          ? updaterOrValue(state.rowSelection)
          : updaterOrValue,
    })),
  clearSelected: () => set({ rowSelection: {} }),

  data: [],
  setData: (updater) =>
    set((state) => ({
      data: typeof updater === "function" ? updater(state.data) : updater,
    })),
  addRow: (row) =>
    set((state) => ({
      data: [...state.data, row],
    })),
  clearData: () => set({ data: [] }),
}));
