"use client";

import { useMemo, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Trash2, CheckCircle2, XCircle, Clock, Upload, Loader2 } from "lucide-react";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { useMe } from "@/features/auth/hooks/useMe";
import {
  useUserDocuments,
  useUploadDocument,
  useDeleteDocument,
  useVerifyDocument,
} from "@/features/users/hooks/useUserDocuments";
import {
  CERTIFICATE_TYPES,
  CERTIFICATE_TYPE_LABELS,
  type CertificateType,
  type UserDocument,
} from "@/features/users/schemas/document.schema";

const MANAGEMENT_ROLES = new Set(["SUPER_ADMIN", "COMPANY_ADMIN", "CLIENT_SERVICE_MANAGER"]);
const MAX_BYTES = 10 * 1024 * 1024;

interface UserDocumentsSectionProps {
  userId: string;
  /** When false, hide the upload form (read-only view). Defaults to true. */
  canUpload?: boolean;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

function DocumentRow({
  doc,
  isManagement,
  onDelete,
  onVerify,
  busy,
}: {
  doc: UserDocument;
  isManagement: boolean;
  onDelete: (doc: UserDocument) => void;
  onVerify: (doc: UserDocument, verified: boolean) => void;
  busy: boolean;
}) {
  const isPdf = (doc.contentType ?? "").includes("pdf");
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-grey-200 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 text-grey-400">
          {isPdf ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-on-surface">{doc.label}</p>
          <p className="truncate text-xs text-grey-500">
            {doc.originalFilename ?? "Document"} · Uploaded {formatDate(doc.uploadedAt)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            {doc.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-grey-100 px-2 py-0.5 font-medium text-grey-600">
                <Clock className="h-3.5 w-3.5" /> Pending
              </span>
            )}
            {doc.expired && (
              <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2 py-0.5 font-medium text-error">
                <XCircle className="h-3.5 w-3.5" /> Expired
              </span>
            )}
            {doc.expiryDate && !doc.expired && (
              <span className="text-grey-500">Expires {formatDate(doc.expiryDate)}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={`/api/documents/${doc.id}/file`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-grey-200 px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-grey-50"
        >
          View
        </a>
        {isManagement && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onVerify(doc, !doc.verified)}
            className={
              doc.verified
                ? "rounded-full border border-grey-200 px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-grey-50 disabled:opacity-50"
                : "rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            }
          >
            {doc.verified ? "Un-verify" : "Verify"}
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete(doc)}
          className="rounded-full p-1.5 text-grey-400 hover:bg-error/10 hover:text-error disabled:opacity-50"
          aria-label="Delete document"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

export function UserDocumentsSection({ userId, canUpload = true }: UserDocumentsSectionProps) {
  const me = useMe();
  const isManagement = MANAGEMENT_ROLES.has(me.data?.role ?? "");

  const documentsQuery = useUserDocuments(userId);
  const upload = useUploadDocument();
  const remove = useDeleteDocument();
  const verify = useVerifyDocument();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [certificateType, setCertificateType] = useState<CertificateType>("VEVO_CHECK");
  const [otherLabel, setOtherLabel] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const documents = documentsQuery.data ?? [];
  const busy = upload.isPending || remove.isPending || verify.isPending;

  const submitError = useMemo(() => {
    if (localError) return localError;
    if (upload.isError) return getErrorMessage(upload.error);
    return null;
  }, [localError, upload.isError, upload.error]);

  function resetForm() {
    setFile(null);
    setCertificateType("VEVO_CHECK");
    setOtherLabel("");
    setIssueDate("");
    setExpiryDate("");
    setLocalError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    upload.reset();
  }

  function handleUpload() {
    setLocalError(null);
    if (!file) {
      setLocalError("Please choose a file to upload.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError("File is too large (max 10MB).");
      return;
    }
    if (certificateType === "OTHER" && otherLabel.trim().length === 0) {
      setLocalError("Please enter a label for the 'Other' certificate.");
      return;
    }
    upload.mutate(
      {
        userId,
        file,
        certificateType,
        otherLabel: certificateType === "OTHER" ? otherLabel.trim() : undefined,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
      },
      { onSuccess: resetForm },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-on-surface">Compliance documents</h3>
        <p className="text-xs text-grey-500">
          Upload certificates as images or PDF (VEVO, police check, insurances, etc.). Documents must
          be verified by management to count toward site assignment.
        </p>
      </div>

      {documentsQuery.isLoading ? (
        <div className="flex justify-center py-6 text-grey-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <p className="rounded-xl border border-dashed border-grey-200 px-3 py-6 text-center text-sm text-grey-500">
          No documents uploaded yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              isManagement={isManagement}
              busy={busy}
              onDelete={(d) => remove.mutate({ documentId: d.id, userId })}
              onVerify={(d, v) => verify.mutate({ documentId: d.id, userId, verified: v })}
            />
          ))}
        </ul>
      )}

      {canUpload && (
        <div className="flex flex-col gap-3 rounded-xl border border-grey-200 p-3">
          <p className="text-sm font-medium text-on-surface">Add a document</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-grey-600">Certificate type</span>
              <select
                className="rounded-lg border border-grey-200 px-3 py-2 text-sm"
                value={certificateType}
                onChange={(e) => setCertificateType(e.target.value as CertificateType)}
              >
                {CERTIFICATE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {CERTIFICATE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
            {certificateType === "OTHER" && (
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-grey-600">Label</span>
                <input
                  className="rounded-lg border border-grey-200 px-3 py-2 text-sm"
                  value={otherLabel}
                  onChange={(e) => setOtherLabel(e.target.value)}
                  placeholder="e.g. Asbestos awareness"
                />
              </label>
            )}
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-grey-600">Issue date (optional)</span>
              <input
                type="date"
                className="rounded-lg border border-grey-200 px-3 py-2 text-sm"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-grey-600">Expiry date (optional)</span>
              <input
                type="date"
                className="rounded-lg border border-grey-200 px-3 py-2 text-sm"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-grey-600">File (image or PDF, max 10MB)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {submitError && (
            <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
              {submitError}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleUpload}
              disabled={upload.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
            >
              {upload.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Upload
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
