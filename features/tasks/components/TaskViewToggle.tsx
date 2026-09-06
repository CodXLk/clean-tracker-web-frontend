"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { TaskView } from "@/features/tasks/store/taskView.store";

interface TaskViewToggleProps {
  value: TaskView;
  onChange: (view: TaskView) => void;
  className?: string;
}

/** Segmented toggle to switch the Tasks overview between area cards and a floor-grouped list. */
export function TaskViewToggle({ value, onChange, className }: TaskViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Task layout"
      className={cn("inline-flex items-center gap-1 rounded-full border border-grey-200 bg-white p-1", className)}
    >
      <Option active={value === "cards"} onClick={() => onChange("cards")} label="Card view">
        <LayoutGrid size={16} aria-hidden="true" />
      </Option>
      <Option active={value === "list"} onClick={() => onChange("list")} label="List view">
        <List size={16} aria-hidden="true" />
      </Option>
    </div>
  );
}

function Option({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
        active ? "bg-primary text-on-primary" : "text-grey-500 hover:bg-grey-100",
      )}
    >
      {children}
    </button>
  );
}
