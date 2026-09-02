"use client";

import { useQuery } from "@tanstack/react-query";

export interface PublicHoliday {
  date: string; // yyyy-MM-dd
  localName: string;
  name: string;
}

/** Australian public holidays for the given years (Nager.Date), keyed by date. */
export function usePublicHolidays(years: number[]): Map<string, string> {
  const uniqueYears = Array.from(new Set(years)).sort();
  const query = useQuery({
    queryKey: ["public-holidays", "AU", uniqueYears],
    staleTime: 24 * 60 * 60 * 1000, // holidays rarely change — cache for a day
    enabled: uniqueYears.length > 0,
    queryFn: async (): Promise<PublicHoliday[]> => {
      const all = await Promise.all(
        uniqueYears.map(async (y) => {
          try {
            const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${y}/AU`);
            if (!res.ok) return [] as PublicHoliday[];
            return (await res.json()) as PublicHoliday[];
          } catch {
            return [] as PublicHoliday[];
          }
        }),
      );
      return all.flat();
    },
  });

  const map = new Map<string, string>();
  for (const h of query.data ?? []) {
    const label = h.localName || h.name;
    const existing = map.get(h.date);
    map.set(h.date, existing ? `${existing}, ${label}` : label);
  }
  return map;
}
