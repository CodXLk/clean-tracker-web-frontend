import Image from "next/image";
import { Leaf, ShieldCheck, Star } from "lucide-react";
import { BUSINESS } from "@/lib/constants/business";
import { QuoteButton } from "../QuoteButton";

/** The H1 section — the only `<h1>` on the homepage. */
export function Hero() {
    return (
        <section className="relative overflow-hidden bg-ink text-white">
            <Image
                src="/images/marketing/home/hero-bg.jpg"
                alt="Commercial cleaner vacuuming carpet with professional equipment"
                fill
                priority
                sizes="100vw"
                className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-ink/40" />

            <div className="relative mx-auto flex min-h-[640px] max-w-[1368px] flex-col justify-between gap-16 px-5 py-10 sm:px-8 sm:py-14">
                <div className="flex flex-col gap-6">
                    <div className="flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur">
                        <span className="flex" aria-hidden="true">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Star key={i} size={14} className="fill-brand-2 text-brand-2" />
                            ))}
                        </span>
                        Trusted commercial cleaning across {BUSINESS.serviceArea}
                    </div>

                    <h1 className="max-w-3xl text-4xl font-medium tracking-tight sm:text-6xl">
                        Professional Commercial Cleaning Services in Australia
                    </h1>
                </div>

                <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                        <QuoteButton />
                        <div className="flex flex-col gap-1">
                            <p className="text-sm text-white/70">Speak with our team:</p>
                            <a href={BUSINESS.phoneHref} className="text-3xl font-medium tracking-tight text-brand-2 hover:underline">
                                {BUSINESS.phone}
                            </a>
                        </div>
                    </div>

                    <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-white">
                        <li className="flex items-center gap-2">
                            <ShieldCheck size={18} className="text-brand-2" aria-hidden="true" />
                            Police &amp; VEVO Checked Staff.
                        </li>
                        <li className="flex items-center gap-2">
                            <Star size={18} className="text-brand-2" aria-hidden="true" />
                            Fully Insured &amp; WHS Compliant
                        </li>
                        <li className="flex items-center gap-2">
                            <Leaf size={18} className="text-brand-2" aria-hidden="true" />
                            Eco-Friendly Cleaning Solutions
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    );
}
