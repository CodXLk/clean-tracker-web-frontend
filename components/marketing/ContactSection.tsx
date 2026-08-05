"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGSAP } from "@gsap/react";
import { CheckCircle2, Mail, MapPin, Phone } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils/cn";
import { clientApi } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ContactSchema, type ContactInput } from "@/features/contact/schemas/contact.schema";
import { SectionHeading } from "./SectionHeading";

const FIELD_CLASS =
  "rounded-2xl border bg-white px-4 py-3 font-body text-base text-on-surface outline-none " +
  "transition-colors placeholder:text-grey-500 focus:border-primary focus:ring-2 focus:ring-primary/25";

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver:      zodResolver(ContactSchema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
  });

  useGSAP(
    () => {
      if (!sectionRef.current || reduceMotion) return;
      gsap.from(sectionRef.current.querySelectorAll("[data-reveal]"), {
        opacity: 0,
        y: 32,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%", once: true },
      });
    },
    { scope: sectionRef, dependencies: [reduceMotion] },
  );

  async function onSubmit(data: ContactInput) {
    setSubmitError(null);
    try {
      await clientApi.post(ENDPOINTS.contact.submit, data);
      setSubmitted(true);
      reset();
    } catch {
      setSubmitError("We couldn't send that just now. Please try again, or email us directly.");
    }
  }

  return (
    <section
      id="contact"
      ref={sectionRef}
      data-nav-theme="light"
      aria-labelledby="contact-heading"
      className="relative py-[clamp(4rem,8vw,7.5rem)]"
    >
      <div className="mx-auto grid w-full max-w-[1512px] grid-cols-1 items-start gap-12 px-[max(1.25rem,2.712vw)] lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col">
          <SectionHeading id="contact-heading" lead="Get a" accent="Quote" data-reveal />

          <p
            data-reveal
            className="mt-6 max-w-xl font-body text-quote font-medium leading-snug text-white"
          >
            Tell us about your site and what needs cleaning. We&apos;ll come back to you with a
            tailored quote, usually within one business day.
          </p>

          <ul data-reveal className="mt-10 flex flex-col gap-4 font-body text-white">
            <li className="flex items-center gap-3">
              <MapPin size={22} className="shrink-0 text-accent" aria-hidden="true" />
              <span>Victoria, Australia</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={22} className="shrink-0 text-accent" aria-hidden="true" />
              <a href="tel:1800890991" className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                1800 890 991
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={22} className="shrink-0 text-accent" aria-hidden="true" />
              <a
                href="mailto:info@primewayservices.com.au"
                className="rounded break-all hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                info@primewayservices.com.au
              </a>
            </li>
          </ul>
        </div>

        <div
          data-reveal
          className="rounded-[clamp(1.5rem,2.65vw,2.5rem)] bg-white p-6 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] sm:p-9"
        >
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <CheckCircle2 size={44} className="text-success" aria-hidden="true" />
              <p className="font-heading text-xl font-bold text-on-surface">
                Thanks — we&apos;ll be in touch shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-2 rounded font-body text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-name" className="font-body text-sm font-semibold text-on-surface">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  autoComplete="name"
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "contact-name-error" : undefined}
                  {...register("name")}
                  className={cn(FIELD_CLASS, errors.name ? "border-danger" : "border-grey-300")}
                />
                {errors.name && (
                  <p id="contact-name-error" className="font-body text-xs text-danger">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-email" className="font-body text-sm font-semibold text-on-surface">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "contact-email-error" : undefined}
                  {...register("email")}
                  className={cn(FIELD_CLASS, errors.email ? "border-danger" : "border-grey-300")}
                />
                {errors.email && (
                  <p id="contact-email-error" className="font-body text-xs text-danger">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-phone" className="font-body text-sm font-semibold text-on-surface">
                  Phone <span className="font-normal text-grey-600">(optional)</span>
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  autoComplete="tel"
                  {...register("phone")}
                  className={cn(FIELD_CLASS, "border-grey-300")}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-message" className="font-body text-sm font-semibold text-on-surface">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  aria-invalid={errors.message ? true : undefined}
                  aria-describedby={errors.message ? "contact-message-error" : undefined}
                  {...register("message")}
                  className={cn(
                    FIELD_CLASS,
                    "resize-none",
                    errors.message ? "border-danger" : "border-grey-300",
                  )}
                />
                {errors.message && (
                  <p id="contact-message-error" className="font-body text-xs text-danger">
                    {errors.message.message}
                  </p>
                )}
              </div>

              {submitError && (
                <p role="alert" className="font-body text-sm text-danger">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "mt-1 h-[3.4375rem] rounded-full bg-primary font-heading text-xl font-extrabold text-white",
                  "shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] transition-colors hover:bg-primary-variant",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {isSubmitting ? "Sending…" : "Get a Quote"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
