"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  AnnouncementListSchema,
  AnnouncementSchema,
  type Announcement,
  type AnnouncementInput,
} from "@/features/announcements/schemas/announcement.schema";

export const ANNOUNCEMENT_PAGE_SIZE = 20;
/** The management table sorts and pages on the client, so it loads bigger batches. */
export const SENT_ANNOUNCEMENT_PAGE_SIZE = 50;

const announcementKeys = {
  all: ["announcements"] as const,
  sent: () => [...announcementKeys.all, "sent"] as const,
  mine: () => [...announcementKeys.all, "mine"] as const,
  preview: (audience: Pick<AnnouncementInput, "audience" | "roles" | "siteIds">) =>
    [...announcementKeys.all, "preview", audience] as const,
};

function pagedList(key: readonly unknown[], url: string, pageSize = ANNOUNCEMENT_PAGE_SIZE) {
  return {
    queryKey: key,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const { data } = await clientApi.get(url, { params: { limit: pageSize, before: pageParam } });
      return AnnouncementListSchema.parse(data);
    },
    getNextPageParam: (last: Announcement[]) =>
      last.length < pageSize ? undefined : last[last.length - 1]?.createdAt,
  };
}

/** Sent announcements with read counts (management). */
export function useSentAnnouncements(enabled = true) {
  return useInfiniteQuery({
    ...pagedList(announcementKeys.sent(), ENDPOINTS.announcements.list, SENT_ANNOUNCEMENT_PAGE_SIZE),
    enabled,
  });
}

/** Announcements addressed to the current user. */
export function useMyAnnouncements() {
  return useInfiniteQuery(pagedList(announcementKeys.mine(), ENDPOINTS.announcements.mine));
}

/** How many people the audience currently reaches (debounced by the caller). */
export function useAudiencePreview(audience: Pick<AnnouncementInput, "audience" | "roles" | "siteIds">, enabled: boolean) {
  return useQuery({
    queryKey: announcementKeys.preview(audience),
    enabled,
    queryFn: async () => {
      const { data } = await clientApi.post(ENDPOINTS.announcements.preview, audience);
      return (data as { recipientCount: number }).recipientCount;
    },
  });
}

export function useSendAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AnnouncementInput) => {
      const { data } = await clientApi.post(ENDPOINTS.announcements.create, input);
      return AnnouncementSchema.parse(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementKeys.all });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.delete(ENDPOINTS.announcements.byId(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementKeys.all });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
