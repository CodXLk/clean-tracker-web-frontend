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
import { ContactSchema, type ContactInput } from "@/features/contact/schemas/contact.schema";

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [submitted, setSubmitted] = useState(false);

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
      if (!sectionRef.current) return;
      gsap.fromTo(
        sectionRef.current.querySelectorAll("[data-reveal]"),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        },
      );
    },
    { scope: sectionRef, dependencies: [] },
  );

  async function onSubmit(data: ContactInput) {
    await clientApi.post(ENDPOINTS.contact.submit, data);
    setSubmitted(true);
    reset();
  }

  return (
    <section id="contact" ref={sectionRef} className="bg-grey-100 py-24">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <h2 data-reveal className="font-heading text-4xl font-bold sm:text-5xl">
            <span className="text-black">Get a </span>
            <span className="text-[#ED5F25]">Quote</span>
          </h2>
          <p data-reveal className="max-w-md text-lg text-grey-700">
            Tell us about your site and cleaning needs, and our team will get back to you with a
            tailored quote.
          </p>
          <div data-reveal className="flex flex-col gap-4 text-on-surface">
            <div className="flex items-center gap-3">
              <MapPin size={20} className="shrink-0 text-primary" aria-hidden="true" />
              <span>Australia</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={20} className="shrink-0 text-primary" aria-hidden="true" />
              <span>1800 890 991</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={20} className="shrink-0 text-primary" aria-hidden="true" />
              <span>info@primewayservices.com.au</span>
            </div>
          </div>
        </div>

        <div data-reveal className="rounded-3xl bg-white p-8 shadow-xl">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <CheckCircle2 size={40} className="text-success" aria-hidden="true" />
              <p className="text-lg font-semibold text-on-surface">Thanks — we&apos;ll be in touch shortly!</p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-2 text-sm font-medium text-primary hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-name" className="text-sm font-medium text-on-surface">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  {...register("name")}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                    errors.name ? "border-danger" : "border-grey-300",
                  )}
                />
                {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-email" className="text-sm font-medium text-on-surface">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  {...register("email")}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                    errors.email ? "border-danger" : "border-grey-300",
                  )}
                />
                {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-phone" className="text-sm font-medium text-on-surface">
                  Phone (optional)
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  {...register("phone")}
                  className="rounded-xl border border-grey-300 px-3 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-message" className="text-sm font-medium text-on-surface">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  {...register("message")}
                  className={cn(
                    "resize-none rounded-xl border px-3 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                    errors.message ? "border-danger" : "border-grey-300",
                  )}
                />
                {errors.message && <p className="text-xs text-danger">{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 h-12 rounded-full bg-primary font-heading text-sm font-extrabold text-white transition-colors hover:bg-primary-variant disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Get a Quote"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
