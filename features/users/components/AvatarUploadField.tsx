"use client";

import { useEffect, useMemo, useRef } from "react";
import { Camera, ImagePlus, Trash2, User as UserIcon } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";

interface AvatarUploadFieldProps {
  /** Locally selected (not-yet-saved) file, shown as an immediate preview. */
  file?: File | null;
  onSelect: (file: File) => void;
  onRemove?: () => void;
  /** Existing saved avatar (edit flow) — shown when no local file is selected. */
  userId?: string;
  hasPhoto?: boolean;
  version?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  busy?: boolean;
  size?: number;
}

/** Circular avatar with capture-from-camera and choose-from-files controls. */
export function AvatarUploadField({
  file,
  onSelect,
  onRemove,
  userId,
  hasPhoto,
  version,
  firstName,
  lastName,
  busy = false,
  size = 96,
}: AvatarUploadFieldProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const showSaved = !previewUrl && userId && hasPhoto;
  const canRemove = !!onRemove && (!!previewUrl || showSaved);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (picked) onSelect(picked);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <span
        className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-semibold text-ink"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : showSaved ? (
          <UserAvatar
            userId={userId!}
            hasPhoto={hasPhoto}
            version={version}
            firstName={firstName}
            lastName={lastName}
            size={size}
          />
        ) : firstName || lastName ? (
          `${(firstName ?? "").charAt(0)}${(lastName ?? "").charAt(0)}`.toUpperCase() || "?"
        ) : (
          <UserIcon size={Math.round(size * 0.42)} aria-hidden="true" className="text-primary" />
        )}
      </span>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full border border-grey-300 px-3.5 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-60"
        >
          <Camera size={14} aria-hidden="true" />
          Take photo
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full border border-grey-300 px-3.5 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-grey-100 disabled:opacity-60"
        >
          <ImagePlus size={14} aria-hidden="true" />
          Upload
        </button>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-error transition-colors hover:bg-error/10 disabled:opacity-60"
          >
            <Trash2 size={14} aria-hidden="true" />
            Remove
          </button>
        )}
      </div>

      {/* Camera capture (mobile opens the camera directly); desktop falls back to the file picker. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleChange}
      />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  );
}
