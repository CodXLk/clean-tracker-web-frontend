"use client";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  /** Big number shown in the centre; defaults to the total. */
  centerValue?: string | number;
  centerLabel?: string;
}

/** Dependency-free SVG donut chart with a centre label and a legend. */
export function DonutChart({
  segments,
  size = 176,
  thickness = 22,
  centerValue,
  centerLabel,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offset = 0;
  const arcs =
    total > 0
      ? segments
          .filter((s) => s.value > 0)
          .map((s) => {
            const fraction = s.value / total;
            const dash = fraction * circumference;
            const arc = (
              <circle
                key={s.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return arc;
          })
      : [];

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--color-grey-100, #f1f1f1)"
            strokeWidth={thickness}
          />
          {arcs}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-on-surface">{centerValue ?? total}</span>
          {centerLabel && <span className="text-xs text-grey-500">{centerLabel}</span>}
        </div>
      </div>
      <ul className="flex w-full flex-col gap-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 text-grey-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
            <span className="font-semibold text-on-surface">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
