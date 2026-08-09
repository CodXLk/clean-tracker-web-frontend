import { create } from "zustand";

type UIState = {
  isSidebarOpen:      boolean;
  mobileNavOpen:      boolean;
  mobileBarHidden:    boolean;
  theme:              "light" | "dark";
  toggleSidebar:      () => void;
  setMobileNav:       (open: boolean) => void;
  setMobileBarHidden: (hidden: boolean) => void;
  setTheme:           (theme: "light" | "dark") => void;
};

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen:      true,
  mobileNavOpen:      false,
  mobileBarHidden:    false,
  theme:              "light",
  toggleSidebar:      () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setMobileNav:       (open) => set({ mobileNavOpen: open }),
  setMobileBarHidden: (hidden) => set({ mobileBarHidden: hidden }),
  setTheme:           (theme) => set({ theme }),
}));
