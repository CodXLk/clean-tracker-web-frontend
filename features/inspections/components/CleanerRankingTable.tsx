import { Star } from "lucide-react";
import { ProgressBar } from "@/components/shared/ProgressBar";
import type { CleanerRanking } from "@/features/inspections/types";

interface CleanerRankingTableProps {
  rankings: CleanerRanking[];
}

export function CleanerRankingTable({ rankings }: CleanerRankingTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-grey-100">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-grey-100 bg-grey-100/60 text-xs font-semibold text-on-surface">
            <th scope="col" className="px-4 py-3">Rank</th>
            <th scope="col" className="px-4 py-3">Cleaner</th>
            <th scope="col" className="px-4 py-3">Site</th>
            <th scope="col" className="px-4 py-3">Tasks Completed</th>
            <th scope="col" className="px-4 py-3">Avg. Rating</th>
            <th scope="col" className="px-4 py-3">On-Time Rate</th>
            <th scope="col" className="px-4 py-3">Performance</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((row) => (
            <tr key={row.rank} className="border-b border-grey-100 last:border-b-0">
              <td className="px-4 py-3 text-grey-500">{row.rank}</td>
              <td className="px-4 py-3 font-medium text-on-surface">{row.cleaner}</td>
              <td className="px-4 py-3 text-grey-500">{row.site}</td>
              <td className="px-4 py-3 text-on-surface">{row.tasksCompleted}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  <Star size={14} className="text-[#ED5F25]" aria-hidden="true" />
                  {row.avgRating}
                </span>
              </td>
              <td className="px-4 py-3 text-on-surface">{row.onTimeRate}%</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <ProgressBar percent={row.performance} className="w-24" />
                  <span className="text-xs text-grey-500">{row.performance}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
