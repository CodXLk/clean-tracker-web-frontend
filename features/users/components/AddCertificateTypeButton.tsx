"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCreateCertificateType } from "@/features/users/hooks/useCertificateTypes";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";

interface AddCertificateTypeButtonProps {
  /** Called with the new certificate's key once created, so callers can auto-select it. */
  onCreated?: (key: string) => void;
}

/** Inline control to define a new reusable custom certificate type. */
export function AddCertificateTypeButton({ onCreated }: AddCertificateTypeButtonProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState("");
  const create = useCreateCertificateType();

  function submit() {
    const clean = label.trim();
    if (!clean) return;
    create.mutate(clean, {
      onSuccess: (opt) => {
        onCreated?.(opt.key);
        setLabel("");
        setEditing(false);
      },
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 self-start rounded-full border border-dashed border-grey-300 px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-primary hover:bg-primary/5"
      >
        <Plus size={14} aria-hidden="true" />
        Add certificate
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 self-stretch">
      <div className="flex flex-wrap items-center gap-2">
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="e.g. Asbestos Awareness"
          className="min-w-[12rem] flex-1 rounded-lg border border-grey-300 bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={submit}
          disabled={create.isPending || !label.trim()}
          className="rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {create.isPending ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setLabel("");
            create.reset();
          }}
          className="rounded-full border border-grey-300 px-3 py-1.5 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100"
        >
          Cancel
        </button>
      </div>
      {create.isError && (
        <p className="text-xs font-medium text-error">{getErrorMessage(create.error)}</p>
      )}
    </div>
  );
}
