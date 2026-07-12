import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AdminStatCardProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  badge?: string;
  badgeColor?: string;
}

export function AdminStatCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
  badge,
  badgeColor,
}: AdminStatCardProps) {
  return (
    <div className="rounded-2xl bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconBg)}>
          <Icon size={20} className={iconColor} aria-hidden="true" />
        </div>
        {badge !== undefined && (
          <span className={cn("text-xs font-medium", badgeColor)}>{badge}</span>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold text-on-surface">{value}</p>
      <p className="mt-1 text-sm text-grey-500">{label}</p>
    </div>
  );
}
