"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import {
  NotificationListSchema,
  UnreadCountSchema,
  type Notification,
} from "@/features/notifications/schemas/notification.schema";

export const NOTIFICATION_PAGE_SIZE = 30;

const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  recent: (limit: number) => [...notificationKeys.all, "recent", limit] as const,
  unread: () => [...notificationKeys.all, "unread"] as const,
};

async function fetchNotifications(limit: number, before?: string) {
  const { data } = await clientApi.get(ENDPOINTS.notifications.list, { params: { limit, before } });
  return NotificationListSchema.parse(data);
}

/** Newest first, loaded a page at a time (cursor = createdAt of the last loaded item). */
export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchNotifications(NOTIFICATION_PAGE_SIZE, pageParam),
    getNextPageParam: (last: Notification[]) =>
      last.length < NOTIFICATION_PAGE_SIZE ? undefined : last[last.length - 1]?.createdAt,
  });
}

/** Just the latest few (bell dropdown); only fetched while `enabled`. */
export function useRecentNotifications(limit: number, enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.recent(limit),
    queryFn: () => fetchNotifications(limit),
    enabled,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: async () => {
      const { data } = await clientApi.get(ENDPOINTS.notifications.unreadCount);
      return UnreadCountSchema.parse(data).count;
    },
    // Keep the bell badge fresh.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientApi.post(ENDPOINTS.notifications.read(id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await clientApi.post(ENDPOINTS.notifications.readAll);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
