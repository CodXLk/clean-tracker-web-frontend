import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  ComplaintsResponseSchema,
  ComplaintSchema,
  type ComplaintsResponse,
  type Complaint,
  type CreateComplaintInput,
} from "@/features/complaints/schemas/complaint.schema";

export async function fetchComplaints(): Promise<ComplaintsResponse> {
  const { data } = await clientApi.get(ENDPOINTS.complaints.list);
  return ComplaintsResponseSchema.parse(data);
}

export async function createComplaint(input: CreateComplaintInput): Promise<Complaint> {
  const { data } = await clientApi.post(ENDPOINTS.complaints.create, input);
  return ComplaintSchema.parse(data);
}

export async function resolveComplaint(id: string): Promise<Complaint> {
  const { data } = await clientApi.post(ENDPOINTS.complaints.resolve(id));
  return ComplaintSchema.parse(data);
}
