import { create } from "zustand";

// UI-only preference: which assigned site's data (tasks, complaints, ...) the cleaner is
// currently viewing. Kept outside component state so it survives navigating into a
// sub-page (e.g. an area's task list) and back — a plain useState resets on unmount.
type ActiveSiteState = {
  selectedSiteId: string | null;
  /** Once true, the auto-default-to-checked-in-site effect stops overriding the pick. */
  touched: boolean;
  setSelectedSiteId: (siteId: string | null) => void;
  setDefaultSiteId: (siteId: string | null) => void;
};

export const useActiveSiteStore = create<ActiveSiteState>((set) => ({
  selectedSiteId: null,
  touched: false,
  setSelectedSiteId: (siteId) => set({ selectedSiteId: siteId, touched: true }),
  setDefaultSiteId: (siteId) => set({ selectedSiteId: siteId }),
}));
