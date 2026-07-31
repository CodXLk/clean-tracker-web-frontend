import { ClipboardList, Droplet, Sparkles, Wrench, type LucideIcon } from "lucide-react";

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  "general cleaning": Sparkles,
  "deep cleaning":     Droplet,
  "floor polishing":   Wrench,
  "periodical":        ClipboardList,
};

export function getTaskCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICON_MAP[category.toLowerCase()] ?? ClipboardList;
}
