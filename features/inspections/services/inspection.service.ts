import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  InspectionsResponseSchema,
  MyTaskSchema,
  type InspectionsResponse,
  type MyTask,
  type CompleteTaskInput,
} from "@/features/inspections/schemas/inspection.schema";

export async function fetchInspections(): Promise<InspectionsResponse> {
  const { data } = await clientApi.get(ENDPOINTS.inspections.list);
  return InspectionsResponseSchema.parse(data);
}

export async function startTask(id: string): Promise<MyTask> {
  const { data } = await clientApi.post(ENDPOINTS.inspections.startTask(id));
  return MyTaskSchema.parse(data);
}

export async function completeTask(id: string, input: CompleteTaskInput): Promise<void> {
  await clientApi.post(ENDPOINTS.inspections.completeTask(id), input);
}

export async function completeArea(id: string, input: CompleteTaskInput): Promise<void> {
  await clientApi.post(ENDPOINTS.inspections.completeArea(id), input);
}
