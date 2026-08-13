"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  CertificateType,
  UserDocumentListSchema,
  type UserDocument,
} from "@/features/users/schemas/document.schema";

function invalidate(queryClient: ReturnType<typeof useQueryClient>, userId: string) {
  queryClient.invalidateQueries({ queryKey: ["user-documents", userId] });
  // Eligibility for site assignment depends on verified documents.
  queryClient.invalidateQueries({ queryKey: ["site-eligible"] });
}

/** List a user's compliance documents. */
export function useUserDocuments(userId: string | undefined, enabled = true) {
  return useQuery<UserDocument[]>({
    queryKey: ["user-documents", userId],
    enabled: Boolean(userId) && enabled,
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.users.documents(userId as string));
      return UserDocumentListSchema.parse(data);
    },
  });
}

export interface UploadDocumentInput {
  userId: string;
  file: File;
  certificateType: CertificateType;
  otherLabel?: string;
  issueDate?: string;
  expiryDate?: string;
}

/** Upload a compliance document (image or PDF). */
export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UploadDocumentInput) => {
      const formData = new FormData();
      formData.append("file", input.file);
      formData.append("certificateType", input.certificateType);
      if (input.otherLabel) formData.append("otherLabel", input.otherLabel);
      if (input.issueDate) formData.append("issueDate", input.issueDate);
      if (input.expiryDate) formData.append("expiryDate", input.expiryDate);
      await clientApi.post(ENDPOINTS.users.documents(input.userId), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (_data, input) => invalidate(queryClient, input.userId),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentId }: { documentId: string; userId: string }) => {
      await clientApi.delete(ENDPOINTS.documents.byId(documentId));
    },
    onSuccess: (_data, input) => invalidate(queryClient, input.userId),
  });
}

/** Verify or un-verify a document (management). */
export function useVerifyDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      documentId,
      verified,
    }: {
      documentId: string;
      userId: string;
      verified: boolean;
    }) => {
      await clientApi.post(`${ENDPOINTS.documents.verify(documentId)}?verified=${verified}`);
    },
    onSuccess: (_data, input) => invalidate(queryClient, input.userId),
  });
}
