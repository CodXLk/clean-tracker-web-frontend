import { create } from "zustand";
import { persist } from "zustand/middleware";

// Cleaner's preferred layout for the Tasks overview: area cards or a floor-grouped list.
// Persisted to localStorage so the choice survives across sessions.
export type TaskView = "cards" | "list";

type TaskViewState = {
  view: TaskView;
  setView: (view: TaskView) => void;
};

export const useTaskViewStore = create<TaskViewState>()(
  persist(
    (set) => ({
      view: "cards",
      setView: (view) => set({ view }),
    }),
    { name: "primeway.tasks.view" },
  ),
);
