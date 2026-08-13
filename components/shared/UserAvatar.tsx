"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface UserAvatarProps {
  userId: string;
  hasPhoto?: boolean;
  /** Bumps the image URL so a freshly uploaded photo isn't served from cache. */
  version?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  /** Pixel size of the circle. */
  size?: number;
  className?: string;
}

function initials(first?: string | null, last?: string | null): string {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  const chars = `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
  return chars || (f.charAt(0) || "?").toUpperCase();
}

/** Circular user avatar: shows the uploaded photo when available, else initials. */
export function UserAvatar({
  userId,
  hasPhoto,
  version,
  firstName,
  lastName,
  size = 40,
  className,
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const showPhoto = hasPhoto && !failed;
  const src = `/api/users/${userId}/photo${version ? `?v=${encodeURIComponent(version)}` : ""}`;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-semibold text-primary",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initials(firstName, lastName)
      )}
    </span>
  );
}
