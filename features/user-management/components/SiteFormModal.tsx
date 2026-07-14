"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/shared/Modal";
import { TextField } from "@/components/shared/TextField";
import { PhoneNumberField } from "@/components/shared/PhoneNumberField";
import { PillButton } from "@/components/shared/PillButton";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { SearchableSelect, type SelectOption } from "./SearchableSelect";
import { LocationPicker } from "./LocationPicker";
import { FloorsSection } from "./FloorsSection";
import { FloorsModal } from "./FloorsModal";
import { SiteFormSchema, type Site, type SiteFormInput } from "@/features/user-management/schemas/site.schema";
import { useClientCompanies } from "@/features/user-management/hooks/useClientCompanies";
import { useClients } from "@/features/user-management/hooks/useClients";
import { useCreateSite, useUpdateSite } from "@/features/user-management/hooks/useSites";

interface SiteFormModalProps {
  open: boolean;
  onClose: () => void;
  site?: Site | null;
}

const EMPTY: SiteFormInput = {
  clientCompanyId: "",
  clientId: "",
  name: "",
  contactPersonName: "",
  contactNumber: "",
  googleMapsLink: "",
  streetAddress: "",
};

export function SiteFormModal({ open, onClose, site }: SiteFormModalProps) {
  const isEdit = !!site;
  const companiesQuery = useClientCompanies();
  const createMutation = useCreateSite();
  const updateMutation = useUpdateSite();
  const active = isEdit ? updateMutation : createMutation;

  // On create, chain straight into a dedicated Floors modal (whose own "manage areas"
  // action opens a further Areas modal) instead of showing floors inline in this modal.
  const [floorsModalSite, setFloorsModalSite] = useState<Site | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SiteFormInput>({
    resolver: zodResolver(SiteFormSchema),
    defaultValues: EMPTY,
  });

  const selectedCompanyId = watch("clientCompanyId");
  const selectedClientId = watch("clientId");
  const mapsLink = watch("googleMapsLink") ?? "";

  const clientsQuery = useClients(selectedCompanyId || undefined, { enabled: !!selectedCompanyId });

  const companyOptions: SelectOption[] = useMemo(
    () => (companiesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name, sublabel: c.email ?? undefined })),
    [companiesQuery.data],
  );
  const clientOptions: SelectOption[] = useMemo(
    () => (clientsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name, sublabel: c.email ?? undefined })),
    [clientsQuery.data],
  );

  // Reset the form each time the modal opens (create vs edit).
  useEffect(() => {
    if (!open) return;
    reset(
      site
        ? {
            clientCompanyId: site.clientCompanyId,
            clientId: site.clientId,
            name: site.name,
            contactPersonName: site.contactPersonName ?? "",
            contactNumber: site.contactNumber ?? "",
            googleMapsLink: site.googleMapsLink ?? "",
            streetAddress: site.streetAddress ?? "",
          }
        : EMPTY,
    );
    createMutation.reset();
    updateMutation.reset();
    setFloorsModalSite(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, site]);

  // Auto-select the only client when a client-company has exactly one.
  const autoSelectGuard = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedCompanyId) return;
    if (clientsQuery.isLoading || !clientsQuery.data) return;
    // Only auto-select once per company, and never override an existing choice.
    if (autoSelectGuard.current === selectedCompanyId) return;
    autoSelectGuard.current = selectedCompanyId;
    if (clientsQuery.data.length === 1 && !selectedClientId) {
      setValue("clientId", clientsQuery.data[0].id, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId, clientsQuery.data, clientsQuery.isLoading]);

  function handleCompanyChange(next: string) {
    setValue("clientCompanyId", next, { shouldValidate: true });
    setValue("clientId", "", { shouldValidate: false });
    autoSelectGuard.current = null;
  }

  function onSubmit(values: SiteFormInput) {
    if (isEdit && site) {
      updateMutation.mutate({ id: site.id, input: values }, { onSuccess: onClose });
    } else {
      createMutation.mutate(values, {
        onSuccess: (created) => {
          onClose();
          setFloorsModalSite(created);
        },
      });
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? "Edit site" : "Add a site"}
        description="Select a client-company and client, then enter the site details."
      >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Controller
          control={control}
          name="clientCompanyId"
          render={({ field }) => (
            <SearchableSelect
              label="Client-company"
              required
              options={companyOptions}
              value={field.value || null}
              onChange={handleCompanyChange}
              loading={companiesQuery.isLoading}
              placeholder="Select a client-company"
              searchPlaceholder="Search client-companies…"
              emptyMessage="No client-companies found. Create one first."
              error={errors.clientCompanyId?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="clientId"
          render={({ field }) => (
            <SearchableSelect
              label="Client"
              required
              options={clientOptions}
              value={field.value || null}
              onChange={field.onChange}
              disabled={!selectedCompanyId}
              loading={!!selectedCompanyId && clientsQuery.isLoading}
              placeholder={selectedCompanyId ? "Select a client" : "Select a client-company first"}
              searchPlaceholder="Search clients…"
              emptyMessage="This client-company has no clients yet."
              error={errors.clientId?.message}
              hint={
                selectedCompanyId && clientOptions.length === 1
                  ? "Only one client — selected automatically."
                  : undefined
              }
            />
          )}
        />

        <TextField label="Site name" required error={errors.name?.message} {...register("name")} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Contact person name"
            error={errors.contactPersonName?.message}
            {...register("contactPersonName")}
          />
          <Controller
            control={control}
            name="contactNumber"
            render={({ field }) => (
              <PhoneNumberField
                label="Contact number"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                error={errors.contactNumber?.message}
              />
            )}
          />
        </div>

        <TextField
          label="Google Maps location link"
          placeholder="Paste a Google Maps URL or pick on the map"
          error={errors.googleMapsLink?.message}
          {...register("googleMapsLink")}
        />

        <div className="rounded-xl border border-grey-200 bg-grey-50 p-3">
          <LocationPicker
            value={mapsLink}
            onChange={(link) => setValue("googleMapsLink", link, { shouldValidate: true })}
          />
        </div>

        <TextField label="Street address" error={errors.streetAddress?.message} {...register("streetAddress")} />

        {active.isError && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {getErrorMessage(active.error)}
          </p>
        )}

        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-full border border-grey-300 text-sm font-semibold text-on-surface transition-colors hover:bg-grey-100"
          >
            Cancel
          </button>
          <PillButton type="submit" variant="teal" className="h-11 flex-1" disabled={active.isPending}>
            {active.isPending ? "Saving…" : isEdit ? "Save changes" : "Create site"}
          </PillButton>
        </div>
      </form>

      {isEdit && site && (
        <div className="mt-5 flex flex-col gap-3">
          <FloorsSection siteId={site.id} />
        </div>
      )}
      </Modal>

      <FloorsModal
        open={!!floorsModalSite}
        onClose={() => setFloorsModalSite(null)}
        siteId={floorsModalSite?.id ?? ""}
        siteName={floorsModalSite?.name}
      />
    </>
  );
}
