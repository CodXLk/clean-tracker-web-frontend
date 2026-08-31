"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContactSchema, type ContactInput } from "@/features/contact/schemas/contact.schema";
import { clientApi } from "@/lib/api/client";
import { SERVICES } from "@/lib/constants/marketing-services";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

export function ContactForm() {
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ContactInput>({ resolver: zodResolver(ContactSchema) });

    async function onSubmit(data: ContactInput) {
        setStatus("idle");
        try {
            await clientApi.post("/contact", data);
            setStatus("success");
            reset();
        } catch {
            setStatus("error");
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
                        Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        autoComplete="name"
                        {...register("name")}
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "name-error" : undefined}
                        className="w-full rounded-lg border border-line-2 px-4 py-2.5 text-ink outline-none focus:border-brand-2"
                    />
                    {errors.name?.message && <ErrorMessage message={errors.name.message} className="mt-1" />}
                </div>

                <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        {...register("email")}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "email-error" : undefined}
                        className="w-full rounded-lg border border-line-2 px-4 py-2.5 text-ink outline-none focus:border-brand-2"
                    />
                    {errors.email?.message && <ErrorMessage message={errors.email.message} className="mt-1" />}
                </div>
            </div>

            <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink">
                    Phone <span className="font-normal text-body-2">(optional)</span>
                </label>
                <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    {...register("phone")}
                    className="w-full rounded-lg border border-line-2 px-4 py-2.5 text-ink outline-none focus:border-brand-2"
                />
            </div>

            <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink">Which service(s) are you interested in?</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {SERVICES.map((service) => (
                        <label key={service.slug} className="flex items-center gap-2 text-sm text-body-2">
                            <input type="checkbox" value={service.name} {...register("services")} className="size-4 accent-brand-2" />
                            {service.name}
                        </label>
                    ))}
                </div>
            </fieldset>

            <div>
                <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink">
                    Tell us about your facility
                </label>
                <textarea
                    id="message"
                    rows={5}
                    {...register("message")}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? "message-error" : undefined}
                    className="w-full rounded-lg border border-line-2 px-4 py-2.5 text-ink outline-none focus:border-brand-2"
                />
                {errors.message?.message && <ErrorMessage message={errors.message.message} className="mt-1" />}
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-full bg-brand-2 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-2-dark disabled:opacity-60"
            >
                {isSubmitting ? "Sending…" : "Request a Quote"}
            </button>

            <div role="status" aria-live="polite">
                {status === "success" && <p className="text-sm font-medium text-success">Thanks — we&rsquo;ll be in touch shortly!</p>}
                {status === "error" && <p className="text-sm font-medium text-error">Something went wrong. Please try again or call us.</p>}
            </div>
        </form>
    );
}
