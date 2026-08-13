"use client";

export interface TrendBar {
  label: string;
  total: number;
  completed: number;
}

interface TrendBarChartProps {
  data: TrendBar[];
  height?: number;
  /** Colour for the completed portion. */
  completedColor?: string;
}

/** Dependency-free vertical bar chart: a light "total" bar overlaid with a "completed" bar. */
export function TrendBarChart({
  data,
  height = 160,
  completedColor = "var(--color-primary, #0d9488)",
}: TrendBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.total));

  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d) => {
          const totalH = (d.total / max) * (height - 24);
          const completedH = (d.completed / max) * (height - 24);
          return (
            <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-medium text-grey-500">{d.total > 0 ? d.completed : ""}</span>
              <div
                className="relative w-full max-w-[36px] rounded-md bg-grey-100"
                style={{ height: Math.max(totalH, d.total > 0 ? 6 : 2) }}
                title={`${d.completed}/${d.total} completed`}
              >
                <div
                  className="absolute bottom-0 w-full rounded-md"
                  style={{ height: Math.max(completedH, d.completed > 0 ? 4 : 0), backgroundColor: completedColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[11px] text-grey-500">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
