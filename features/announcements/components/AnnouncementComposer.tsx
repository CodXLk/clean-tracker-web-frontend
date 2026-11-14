"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { cn } from "@/lib/utils/cn";
import { useDebounce } from "@/hooks/useDebounce";
import { useSites } from "@/features/user-management/hooks/useSites";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { ROLE_LABELS } from "@/features/users/schemas/user.schema";
import {
  ANNOUNCEMENT_LIMITS,
  ANNOUNCEMENT_ROLES,
  type AnnouncementAudience,
  type AnnouncementRole,
} from "@/features/announcements/schemas/announcement.schema";
import { useAudiencePreview, useSendAnnouncement } from "@/features/announcements/hooks/useAnnouncements";

const AUDIENCE_OPTIONS: { value: AnnouncementAudience; label: string; hint: string }[] = [
  { value: "ALL", label: "Everyone", hint: "All active staff (never clients)" },
  { value: "ROLES", label: "By role", hint: "e.g. only cleaners and supervisors" },
  { value: "SITES", label: "By site", hint: "Supervisors and cleaners assigned to the sites" },
];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function AnnouncementComposer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [audience, setAudience] = useState<AnnouncementAudience>("ALL");
  const [roles, setRoles] = useState<AnnouncementRole[]>([]);
  const [siteIds, setSiteIds] = useState<string[]>([]);
  const [siteQuery, setSiteQuery] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sites = useSites({ enabled: open && audience === "SITES" });
  const send = useSendAnnouncement();

  const audienceValid = audience === "ALL" || (audience === "ROLES" ? roles.length > 0 : siteIds.length > 0);
  const previewInput = useDebounce(
    useMemo(
      () => ({ audience, roles: audience === "ALL" ? [] : roles, siteIds: audience === "SITES" ? siteIds : [] }),
      [audience, roles, siteIds],
    ),
    400,
  );
  const preview = useAudiencePreview(previewInput, open && audienceValid);
  const recipientCount = audienceValid ? preview.data : 0;

  const filteredSites = useMemo(() => {
    const q = siteQuery.trim().toLowerCase();
    const all = [...(sites.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    return q ? all.filter((s) => s.name.toLowerCase().includes(q)) : all;
  }, [sites.data, siteQuery]);

  const canSend = title.trim().length > 0 && message.trim().length > 0 && audienceValid && (recipientCount ?? 0) > 0;

  function reset() {
    setTitle("");
    setMessage("");
    setUrgent(false);
    setAudience("ALL");
    setRoles([]);
    setSiteIds([]);
    setSiteQuery("");
    setConfirming(false);
    setError(null);
  }

  function close() {
    if (send.isPending) return;
    reset();
    onClose();
  }

  function submit() {
    setError(null);
    send.mutate(
      {
        title: title.trim(),
        message: message.trim(),
        urgent,
        audience,
        roles: audience === "ALL" ? [] : roles,
        siteIds: audience === "SITES" ? siteIds : [],
      },
      {
        onSuccess: () => close(),
        onError: (e) => {
          setConfirming(false);
          setError(getErrorMessage(e));
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="New announcement"
      description="Sent to staff as an in-app notification and a push notification on their phones."
      maxWidthClassName="max-w-xl"
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSend) setConfirming(true);
        }}
      >
        <TextField
          label="Title"
          name="announcement-title"
          required
          maxLength={ANNOUNCEMENT_LIMITS.title}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Site closed on Friday"
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="announcement-message" className="text-sm font-medium text-on-surface">
            Message<span className="ml-0.5 text-error">*</span>
          </label>
          <textarea
            id="announcement-message"
            required
            rows={5}
            maxLength={ANNOUNCEMENT_LIMITS.message}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-grey-300 bg-white px-3.5 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-right text-xs text-grey-500">
            {message.length}/{ANNOUNCEMENT_LIMITS.message}
          </p>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-medium text-on-surface">Send to</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {AUDIENCE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex cursor-pointer flex-col rounded-xl border px-3 py-2.5 transition-colors",
                  audience === opt.value ? "border-primary bg-primary/5" : "border-grey-200 hover:bg-grey-50",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-on-surface">
                  <input
                    type="radio"
                    name="audience"
                    value={opt.value}
                    checked={audience === opt.value}
                    onChange={() => setAudience(opt.value)}
                    className="accent-[var(--color-primary)]"
                  />
                  {opt.label}
                </span>
                <span className="mt-0.5 text-xs text-grey-500">{opt.hint}</span>
              </label>
            ))}
          </div>

          {audience !== "ALL" && (
            <div className="mt-2">
              <p className="mb-1.5 text-xs font-medium text-grey-600">
                {audience === "ROLES" ? "Roles" : "Only these roles (optional — leave empty for everyone at the sites)"}
              </p>
              <div className="flex flex-wrap gap-2">
                {ANNOUNCEMENT_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    aria-pressed={roles.includes(role)}
                    onClick={() => setRoles((r) => toggle(r, role))}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      roles.includes(role)
                        ? "border-primary bg-primary text-white"
                        : "border-grey-200 text-on-surface hover:bg-grey-50",
                    )}
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {audience === "SITES" && (
            <div className="mt-2 rounded-xl border border-grey-200">
              <div className="flex items-center gap-2 border-b border-grey-100 px-3 py-2">
                <Search size={14} className="text-grey-400" aria-hidden="true" />
                <input
                  type="search"
                  value={siteQuery}
                  onChange={(e) => setSiteQuery(e.target.value)}
                  placeholder="Search sites"
                  aria-label="Search sites"
                  className="w-full bg-transparent text-sm outline-none"
                />
                {siteIds.length > 0 && (
                  <span className="shrink-0 text-xs text-grey-500">{siteIds.length} selected</span>
                )}
              </div>
              <ul className="max-h-48 overflow-y-auto py-1">
                {sites.isLoading ? (
                  <li className="px-3 py-2 text-sm text-grey-500">Loading sites…</li>
                ) : filteredSites.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-grey-500">No sites found.</li>
                ) : (
                  filteredSites.map((site) => (
                    <li key={site.id}>
                      <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-grey-50">
                        <input
                          type="checkbox"
                          checked={siteIds.includes(site.id)}
                          onChange={() => setSiteIds((s) => toggle(s, site.id))}
                          className="accent-[var(--color-primary)]"
                        />
                        {site.name}
                      </label>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </fieldset>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-grey-200 px-3 py-2.5">
          <input
            type="checkbox"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
            className="mt-0.5 accent-[var(--color-error)]"
          />
          <span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-on-surface">
              <AlertTriangle size={14} className="text-error" aria-hidden="true" /> Urgent
            </span>
            <span className="text-xs text-grey-500">
              Shown highlighted and always pushed — staff can&apos;t mute urgent announcements.
            </span>
          </span>
        </label>

        <p className="text-sm text-grey-600" aria-live="polite">
          {!audienceValid
            ? audience === "ROLES"
              ? "Select at least one role."
              : "Select at least one site."
            : preview.isFetching && recipientCount === undefined
              ? "Counting recipients…"
              : recipientCount === 0
                ? "No active staff match this audience."
                : `Will be sent to ${recipientCount} ${recipientCount === 1 ? "person" : "people"}.`}
        </p>

        {error && <p className="text-sm font-medium text-error">{error}</p>}

        {confirming ? (
          <div className="flex flex-col gap-3 rounded-xl border border-[#ED5F25]/30 bg-[#ED5F25]/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-on-surface">
              Send to {recipientCount} {recipientCount === 1 ? "person" : "people"} now? Pushes can&apos;t be recalled.
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={send.isPending}
                className="rounded-xl border border-grey-200 px-3 py-2 text-sm font-medium hover:bg-grey-50 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={send.isPending}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {send.isPending ? "Sending…" : "Send now"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="rounded-xl border border-grey-200 px-4 py-2 text-sm font-medium hover:bg-grey-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSend}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              Review &amp; send
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
}
