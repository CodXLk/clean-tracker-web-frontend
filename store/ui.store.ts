import { create } from "zustand";
import type { LucideIcon } from "lucide-react";

/** A page-specific action button the shared AppShell top bar renders next to
 *  the notification bell — e.g. Tasks' "open calendar" button. Pages register
 *  it on mount and clear it on unmount so it doesn't leak onto other pages. */
export type HeaderAction = {
  icon:    LucideIcon;
  label:   string;
  onClick: () => void;
};

type UIState = {
  isSidebarOpen: boolean;
  mobileNavOpen: boolean;
  theme:         "light" | "dark";
  headerAction:  HeaderAction | null;
  toggleSidebar: () => void;
  setMobileNav:  (open: boolean) => void;
  setTheme:      (theme: "light" | "dark") => void;
  setHeaderAction: (action: HeaderAction | null) => void;
};

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  mobileNavOpen: false,
  theme:         "light",
  headerAction:  null,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setMobileNav:  (open) => set({ mobileNavOpen: open }),
  setTheme:      (theme) => set({ theme }),
  setHeaderAction: (action) => set({ headerAction: action }),
}));
