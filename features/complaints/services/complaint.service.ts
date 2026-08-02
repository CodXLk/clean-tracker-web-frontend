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

export async function createComplaint(
  input: CreateComplaintInput,
  photos: File[] = [],
): Promise<Complaint> {
  const formData = new FormData();
  const payload = {
    occurrences: input.occurrences,
    title: input.title?.trim() ? input.title.trim() : undefined,
    description: input.description?.trim() ? input.description.trim() : undefined,
    priority: input.priority,
  };
  formData.append(
    "data",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
  );
  for (const photo of photos) {
    formData.append("photos", photo);
  }
  // Override the instance's default JSON content-type so axios computes the
  // multipart boundary from the FormData body.
  const { data } = await clientApi.post(ENDPOINTS.complaints.create, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return ComplaintSchema.parse(data);
}

export async function resolveComplaint(id: string): Promise<Complaint> {
  const { data } = await clientApi.post(ENDPOINTS.complaints.resolve(id));
  return ComplaintSchema.parse(data);
}

/** Schedule redo task(s) for a complaint into the site's next working shift. */
export async function addComplaintRedo(id: string): Promise<void> {
  await clientApi.post(ENDPOINTS.complaints.redo(id));
}
