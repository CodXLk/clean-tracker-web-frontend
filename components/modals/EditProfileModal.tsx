"use client";

import { useState } from "react";
import { Camera, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PillButton } from "@/components/shared/PillButton";

interface EditProfileModalProps {
  open:    boolean;
  onClose: () => void;
}

interface ProfileField {
  id:    string;
  label: string;
  value: string;
  type?: string;
}

export function EditProfileModal({ open, onClose }: EditProfileModalProps) {
  const [firstName, setFirstName] = useState("Peter");
  const [lastName,  setLastName]  = useState("James");
  const [email,     setEmail]     = useState("peter.james@example.com");
  const [phone,     setPhone]     = useState("+1 555 000 1234");

  if (!open) return null;

  function handleSave() {
    onClose();
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
          "inset-x-0 bottom-0 rounded-t-3xl max-h-[90vh] overflow-y-auto",
          "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md lg:rounded-3xl lg:shadow-2xl",
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
              <div className="h-[120px] w-[120px] rounded-full bg-grey-300" />
              <button
                aria-label="Change profile photo"
                className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md transition-opacity hover:opacity-80"
              >
                <Camera size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Fields */}
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

          <EditFieldRow
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
          />

          <EditFieldRow
            label="Phone"
            value={phone}
            onChange={setPhone}
            type="tel"
          />

          <div className="mt-2">
            <PillButton variant="orange" onClick={handleSave}>
              Save
            </PillButton>
          </div>
        </div>
      </div>
    </>
  );
}

interface EditFieldRowProps {
  label:     string;
  value:     string;
  onChange:  (v: string) => void;
  type?:     string;
  className?: string;
}

function EditFieldRow({ label, value, onChange, type = "text", className }: EditFieldRowProps) {
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
        {editing ? (
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
      <button
        onClick={() => setEditing(true)}
        aria-label={`Edit ${label}`}
        className="shrink-0 rounded-full p-1 text-grey-500 transition-colors hover:bg-grey-100 hover:text-primary"
      >
        <Pencil size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
