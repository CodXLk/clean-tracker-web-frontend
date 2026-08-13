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
    <div className="rounded-xl bg-surface p-2.5 shadow-sm sm:rounded-2xl sm:p-5">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl", iconBg)}>
          <Icon className={cn("h-3.5 w-3.5 sm:h-5 sm:w-5", iconColor)} aria-hidden="true" />
        </div>
        {badge !== undefined && (
          <span className={cn("text-[10px] font-medium sm:text-xs", badgeColor)}>{badge}</span>
        )}
      </div>
      <p className="mt-1.5 truncate text-base font-bold text-on-surface sm:mt-3 sm:text-3xl">{value}</p>
      <p className="mt-0.5 truncate text-[10px] text-grey-500 sm:mt-1 sm:text-sm">{label}</p>
    </div>
  );
}
