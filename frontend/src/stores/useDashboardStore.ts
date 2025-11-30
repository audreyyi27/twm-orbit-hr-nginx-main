import { create } from "zustand";

interface DashboardStore {
  statusFilter?: string;
  setStatusFilter: (val: string) => void;
  statusFilterItems: string[];
  setStatusFilterItems: (val: string[]) => void;
}
export const useDashboardStore = create<DashboardStore>((set) => ({
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setStatusFilterItems: (statusFilterItems) => set({ statusFilterItems }),
  statusFilter: undefined,
  statusFilterItems: [],
}));
