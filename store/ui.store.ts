import { create } from "zustand";

type UIState = {
  isSidebarOpen: boolean;
  mobileNavOpen: boolean;
  theme:         "light" | "dark";
  toggleSidebar: () => void;
  setMobileNav:  (open: boolean) => void;
  setTheme:      (theme: "light" | "dark") => void;
};

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  mobileNavOpen: false,
  theme:         "light",
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setMobileNav:  (open) => set({ mobileNavOpen: open }),
  setTheme:      (theme) => set({ theme }),
}));
