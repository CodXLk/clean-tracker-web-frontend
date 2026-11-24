"use client";

import { useRef, useState } from "react";
import { Camera, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PillButton } from "@/components/shared/PillButton";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ImageCropModal } from "@/components/shared/ImageCropModal";
import { useMe } from "@/features/auth/hooks/useMe";
import { useUpdateUser } from "@/features/users/hooks/useUserActions";
import { useUploadMyPhoto } from "@/features/users/hooks/useProfilePhoto";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useCancelEmailChange, useRequestEmailChange, useVerifyEmailChange } from "@/features/users/hooks/useEmailChange";
import { canChangeOwnEmail, changesEmailWithoutVerification } from "@/lib/auth/roles";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EditProfileModalProps {
  open:    boolean;
  onClose: () => void;
}

export function EditProfileModal({ open, onClose }: EditProfileModalProps) {
  const me = useMe();
  const updateUser = useUpdateUser();
  const uploadPhoto = useUploadMyPhoto();
  const requestEmailChange = useRequestEmailChange();
  const verifyEmailChange = useVerifyEmailChange();
  const cancelEmailChange = useCancelEmailChange();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [phone,     setPhone]     = useState("");
  const [email,     setEmail]     = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error,     setError]     = useState<string | null>(null);
  const [cropFile,  setCropFile]  = useState<File | null>(null);
  // Set while a self-service email change waits for the code sent to this (new) address.
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // Re-fill from the cleaner's real data each time the modal transitions to open —
  // adjusting state during render (React's documented pattern for this) instead of an
  // effect, since the modal stays mounted between opens/closes. A change waiting for its emailed
  // code stays on the code step (with the password kept for "resend") until it's verified or cancelled.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && me.data) {
      setFirstName(me.data.firstName);
      setLastName(me.data.lastName ?? "");
      setPhone(me.data.phoneNumber ?? "");
      setError(null);
      setNotice(null);
      if (!verifyEmail) {
        setEmail(me.data.email);
        setCurrentPassword("");
        setCode("");
      }
    }
  }

  // Everyone manages their own sign-in email, confirmed with the current password. Super admins and
  // company admins apply it straight away; everyone else verifies the new address with an emailed code.
  const emailEditable = canChangeOwnEmail(me.data?.role);
  const emailDirect = changesEmailWithoutVerification(me.data?.role);
  const busy = updateUser.isPending || requestEmailChange.isPending;
  const emailDirty = emailEditable && !!me.data && email.trim().toLowerCase() !== me.data.email.toLowerCase();

  if (!open) return null;

  function handleSave() {
    if (!me.data) return;
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }
    const nextEmail = email.trim().toLowerCase();
    const emailChanged = emailEditable && nextEmail !== me.data.email.toLowerCase();
    if (emailChanged && !EMAIL_PATTERN.test(nextEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (emailChanged && !currentPassword) {
      setError("Enter your current password to change your email.");
      return;
    }
    setError(null);
    const details = { firstName: firstName.trim(), lastName: lastName.trim(), phoneNumber: phone.trim() };
    if (emailChanged && !emailDirect) {
      // Save the other details now; the email only changes once the code sent to it is entered.
      updateUser.mutate(
        { id: me.data.id, input: details },
        {
          onSuccess: () =>
            requestEmailChange.mutate(
              { newEmail: nextEmail, currentPassword },
              {
                onSuccess: (pending) => {
                  setVerifyEmail(pending.pendingEmail);
                  setCode("");
                  setNotice(pending.codeSent ? null : "A code was sent to this address a moment ago. Check your inbox.");
                },
                onError: (err) => setError(getErrorMessage(err)),
              },
            ),
          onError: (err) => setError(getErrorMessage(err)),
        },
      );
      return;
    }
    // After a direct email change the session token still names the old email; the API client's
    // single-flight 401 refresh re-issues it on the next request, so no manual refresh is needed.
    updateUser.mutate(
      {
        id: me.data.id,
        input: { ...details, ...(emailChanged ? { email: nextEmail, currentPassword } : {}) },
      },
      {
        onSuccess: onClose,
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  }

  function handleVerify() {
    if (!/^\d{4,8}$/.test(code.trim())) {
      setError("Enter the code from the email.");
      return;
    }
    setError(null);
    verifyEmailChange.mutate(code, {
      onSuccess: onClose,
      onError: (err) => setError(getErrorMessage(err)),
    });
  }

  function handleResend() {
    if (!verifyEmail) return;
    setError(null);
    requestEmailChange.mutate(
      { newEmail: verifyEmail, currentPassword },
      {
        onSuccess: (pending) =>
          setNotice(
            pending.codeSent
              ? `We sent a new code to ${verifyEmail}.`
              : "The last code was sent less than a minute ago. Check your inbox, or try again shortly.",
          ),
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  }

  function handleCancelEmailChange() {
    cancelEmailChange.mutate(undefined, {
      onSettled: () => {
        setVerifyEmail(null);
        setCode("");
        setCurrentPassword("");
        setEmail(me.data?.email ?? "");
        setError(null);
        setNotice(null);
      },
    });
  }
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit profile"
        className={cn(
          "fixed z-50 bg-white",
          "inset-x-0 bottom-0 rounded-t-3xl min-h-[50vh] max-h-[90vh] overflow-y-auto",
          "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:min-h-0 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md lg:rounded-3xl lg:shadow-2xl",
        )}
      >
        {/* Gradient top */}
        <div className="rounded-t-3xl bg-gradient-to-b from-primary/20 to-transparent px-6 pt-6 pb-0">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface">Edit profile</h2>
            <button
              onClick={onClose}
              aria-label="Close edit profile"
              className="rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>

          {/* Avatar */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              {me.data ? (
                <UserAvatar
                  userId={me.data.id}
                  hasPhoto={me.data.hasPhoto}
                  version={me.data.updatedAt}
                  firstName={me.data.firstName}
                  lastName={me.data.lastName}
                  size={120}
                />
              ) : (
                <div className="h-[120px] w-[120px] rounded-full bg-grey-300" />
              )}
              <button
                type="button"
                aria-label="Change profile photo"
                onClick={() => fileRef.current?.click()}
                disabled={uploadPhoto.isPending}
                className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                <Camera size={14} strokeWidth={2} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setCropFile(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>

        {verifyEmail ? (
          <div className="flex flex-col gap-3 px-6 pb-8 pt-4">
            <h3 className="text-base font-semibold text-on-surface">Confirm your new email</h3>
            <p className="text-sm text-grey-600">
              We sent a 6-digit code to <strong className="text-on-surface">{verifyEmail}</strong>. Enter it below to
              start signing in with this address. Until then your current email keeps working.
            </p>
            <label className="flex flex-col gap-0.5 rounded-2xl border border-grey-300 bg-white px-4 py-3">
              <span className="text-xs text-grey-500">Verification code</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                aria-label="Verification code"
                className="bg-transparent text-lg font-semibold tracking-[0.4em] text-on-surface outline-none"
              />
            </label>
            {notice && <p className="px-1 text-xs text-success">{notice}</p>}
            {error && (
              <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
                {error}
              </p>
            )}
            <div className="mt-2">
              <PillButton variant="orange" onClick={handleVerify} disabled={verifyEmailChange.isPending}>
                {verifyEmailChange.isPending ? "Verifying…" : "Verify email"}
              </PillButton>
            </div>
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={handleResend}
                disabled={requestEmailChange.isPending}
                className="text-sm font-medium text-ink hover:underline disabled:opacity-60"
              >
                {requestEmailChange.isPending ? "Sending…" : "Resend code"}
              </button>
              <button
                type="button"
                onClick={handleCancelEmailChange}
                disabled={cancelEmailChange.isPending}
                className="text-sm font-medium text-danger hover:underline disabled:opacity-60"
              >
                Keep my current email
              </button>
            </div>
          </div>
        ) : (
        <div className="flex flex-col gap-3 px-6 pb-8 pt-4">
          {/* First + Last name row */}
          <div className="flex gap-3">
            <EditFieldRow
              label="First Name"
              value={firstName}
              onChange={setFirstName}
              className="flex-1"
            />
            <EditFieldRow
              label="Last Name"
              value={lastName}
              onChange={setLastName}
              className="flex-1"
            />
          </div>

          {emailEditable ? (
            <EditFieldRow label="Email" value={email} onChange={setEmail} type="email" />
          ) : (
            <EditFieldRow label="Email" value={me.data?.email ?? "…"} readOnly />
          )}
          {emailDirty && (
            <>
              <p className="-mt-1 px-1 text-xs text-grey-500">
                {emailDirect
                  ? "You'll sign in with the new email from now on. Your history stays with your account."
                  : "We'll email a code to the new address to confirm it. Your history stays with your account."}
              </p>
              <label className="flex flex-col gap-0.5 rounded-2xl border border-grey-300 bg-white px-4 py-3">
                <span className="text-xs text-grey-500">Current password (to confirm the email change)</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="bg-transparent text-sm font-medium text-on-surface outline-none"
                />
              </label>
            </>
          )}

          <EditFieldRow
            label="Phone"
            value={phone}
            onChange={setPhone}
            type="tel"
          />

          {error && (
            <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
              {error}
            </p>
          )}

          <div className="mt-2">
            <PillButton
              variant="orange"
              onClick={handleSave}
              disabled={busy || !me.data}
            >
              {busy ? "Saving…" : emailDirty && !emailDirect ? "Save & send code" : "Save"}
            </PillButton>
          </div>
        </div>
        )}
      </div>

      <ImageCropModal
        open={cropFile !== null}
        file={cropFile}
        busy={uploadPhoto.isPending}
        onCancel={() => setCropFile(null)}
        onConfirm={(cropped) =>
          uploadPhoto.mutate(cropped, { onSuccess: () => setCropFile(null) })
        }
      />
    </>
  );
}

interface EditFieldRowProps {
  label:      string;
  value:      string;
  onChange?:  (v: string) => void;
  type?:      string;
  className?: string;
  readOnly?:  boolean;
}

function EditFieldRow({ label, value, onChange, type = "text", className, readOnly = false }: EditFieldRowProps) {
  const [editing, setEditing] = useState(false);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-2xl border border-grey-300 bg-white px-4 py-3",
        className,
      )}
    >
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="text-xs text-grey-500">{label}</span>
        {editing && !readOnly && onChange ? (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            autoFocus
            className="text-sm font-medium text-on-surface outline-none bg-transparent"
          />
        ) : (
          <span className="text-sm font-medium text-on-surface truncate">{value}</span>
        )}
      </div>
      {!readOnly && (
        <button
          onClick={() => setEditing(true)}
          aria-label={`Edit ${label}`}
          className="shrink-0 rounded-full p-1 text-grey-500 transition-colors hover:bg-grey-100 hover:text-ink"
        >
          <Pencil size={14} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
