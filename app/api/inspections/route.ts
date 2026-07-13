import { NextResponse } from "next/server";
import {
  getAreasNeedingInspection,
  getMyTasks,
  getSitePerformance,
  getCleanerRankings,
  getInspectionKpis,
} from "@/lib/mock-data/inspections.store";

export async function GET() {
  return NextResponse.json({
    kpis:           getInspectionKpis(),
    areas:          getAreasNeedingInspection(),
    myTasks:        getMyTasks(),
    sitePerformance: getSitePerformance(),
    cleanerRankings: getCleanerRankings(),
  });
}
