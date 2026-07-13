"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { X, CheckCircle2 } from "lucide-react";
import { useCallback, useEffect } from "react";
import type { Delivery } from "@/features/deliveries/types";
import type { ProcessDeliveryInput } from "@/features/deliveries/schemas/delivery.schema";

interface ProcessDeliveryModalProps {
  open:     boolean;
  onClose:  () => void;
  delivery: Delivery | null;
  onSubmit: (id: string, data: ProcessDeliveryInput) => void;
}

interface FormValues {
  items: Array<{ name: string; unit: string; requestedQty: number; deliveredQty: number }>;
  notes: string;
}

export function ProcessDeliveryModal({ open, onClose, delivery, onSubmit }: ProcessDeliveryModalProps) {
  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { items: [], notes: "" },
  });

  const { fields } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (open && delivery) {
      reset({
        items: delivery.items.map((item) => ({
          name:         item.name,
          unit:         item.unit,
          requestedQty: item.requestedQty,
          deliveredQty: item.deliveredQty ?? item.requestedQty,
        })),
        notes: delivery.notes ?? "",
      });
    }
  }, [open, delivery, reset]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  function handleFormSubmit(values: FormValues) {
    if (!delivery) return;
    onSubmit(delivery.id, {
      items: values.items.map((item) => ({ name: item.name, deliveredQty: item.deliveredQty })),
      notes: values.notes,
    });
    handleClose();
  }

  if (!open || !delivery) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="process-delivery-title"
    >
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-surface shadow-2xl">
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <h2 id="process-delivery-title" className="text-lg font-medium text-primary">
              Process {delivery.label}
            </h2>
            <p className="text-sm text-grey-500">{delivery.site}</p>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={handleClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="max-h-[70vh] overflow-y-auto px-6 pb-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-grey-500">Requested By</p>
                <p className="mt-1 text-sm text-on-surface">{delivery.requestedBy}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-grey-500">Date &amp; Time</p>
                <p className="mt-1 text-sm text-on-surface">{delivery.requestedAt}</p>
              </div>
            </div>

            <p className="mb-2 mt-5 text-sm font-medium text-on-surface">Enter Delivered Quantities</p>
            <div className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-xl bg-grey-100 p-4">
                  <p className="text-sm font-medium text-on-surface">{field.name}</p>
                  <p className="text-xs text-grey-500">Requested: {field.requestedQty} {field.unit}</p>
                  <div className="mt-2 flex flex-col gap-2">
                    <label htmlFor={`delivered-qty-${index}`} className="text-xs font-medium text-grey-500">
                      Delivered Quantity
                    </label>
                    <div className="flex items-center gap-2">
                      <Controller
                        control={control}
                        name={`items.${index}.deliveredQty`}
                        render={({ field: qtyField }) => (
                          <input
                            id={`delivered-qty-${index}`}
                            type="number"
                            min={0}
                            value={qtyField.value}
                            onChange={(e) => qtyField.onChange(parseInt(e.target.value, 10) || 0)}
                            className="w-full rounded-xl border border-grey-300 px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        )}
                      />
                      <span className="shrink-0 text-sm text-grey-500">/ {field.requestedQty} {field.unit}</span>
                    </div>
                    <Controller
                      control={control}
                      name={`items.${index}.deliveredQty`}
                      render={({ field: qtyField }) =>
                        qtyField.value >= field.requestedQty ? (
                          <div className="flex items-center gap-1.5 text-xs text-success">
                            <CheckCircle2 size={12} aria-hidden="true" />
                            Full quantity delivered
                          </div>
                        ) : (
                          <span className="text-xs text-grey-500">Partial delivery</span>
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor="delivery-notes" className="text-sm font-medium text-on-surface">
                Delivery Notes (Optional)
              </label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <textarea
                    id="delivery-notes"
                    rows={3}
                    placeholder="Add any notes about this delivery, discrepancies, or special conditions..."
                    {...field}
                    className="resize-none rounded-xl border border-grey-300 px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                )}
              />
            </div>
          </div>

          <div className="px-6 pb-6 pt-4">
            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Confirm &amp; Complete Delivery
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
