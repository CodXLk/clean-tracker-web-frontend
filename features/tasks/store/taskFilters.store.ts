import { create } from "zustand";

// UI-only preference: which floor tab the cleaner has selected on the Tasks overview
// page. Kept outside component state so it survives navigating into a sub-page (e.g.
// an area's task list) and back — a plain useState resets on unmount.
type TaskFiltersState = {
  activeFloor: string | null;
  setActiveFloor: (floor: string | null) => void;
};

export const useTaskFiltersStore = create<TaskFiltersState>((set) => ({
  activeFloor: null,
  setActiveFloor: (floor) => set({ activeFloor: floor }),
}));
