"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchComplaints } from "@/features/complaints/services/complaint.service";
import { complaintKeys } from "./complaintKeys";

export function useComplaints() {
  return useQuery({
    queryKey: complaintKeys.list(),
    queryFn:  fetchComplaints,
  });
}
