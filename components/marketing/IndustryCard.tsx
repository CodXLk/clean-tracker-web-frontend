import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface IndustryCardProps {
  icon: string;
  label: string;
  tone: "teal" | "orange";
  className?: string;
}

/**
 * A 130x130 rounded square rotated 45° into a diamond, with its icon and label
 * counter-rotated so they read level — the industry tile from Figma's
 * "Industries" scenes. Hovering (or focusing) swaps in the photo-and-orange
 * "on" variant from the same file.
 */
export function IndustryCard({ icon, label, tone, className }: IndustryCardProps) {
  return (
    <div
      className={cn(
        "group relative aspect-square w-[clamp(4.5rem,8.598vw,8.125rem)] rotate-45 overflow-hidden",
        "rounded-[clamp(0.625rem,1.06vw,1rem)] transition-transform duration-300",
        "shadow-[0_4px_6px_-4px_rgba(0,0,0,0.25),0_10px_15px_-3px_rgba(0,0,0,0.1)]",
        "hover:scale-105 focus-within:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100",
        tone === "teal" ? "bg-primary" : "bg-accent",
        className,
      )}
    >
      <div className="absolute inset-0 flex -rotate-45 flex-col items-center justify-center gap-[6%] px-[8%] text-center transition-opacity duration-300 group-hover:opacity-0 group-focus-within:opacity-0">
        <span className="relative block w-[clamp(1.5rem,2.78vw,2.625rem)] shrink-0 aspect-square">
          <Image src={icon} alt="" fill sizes="42px" className="object-contain" />
        </span>
        <span className="font-body text-[clamp(0.5rem,0.992vw,0.9375rem)] font-semibold leading-tight text-white">
          {label}
        </span>
      </div>

      {/* Hover state: the tile's photo under a 60% accent wash. It has to be
          over-sized and re-centred because the wrapper carries the 45° turn. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <div className="absolute left-1/2 top-1/2 aspect-square w-[142%] -translate-x-1/2 -translate-y-1/2 -rotate-45">
          <Image
            src="/images/marketing/industries/card-hover.jpg"
            alt=""
            fill
            sizes="190px"
            className="object-cover"
          />
          <span className="absolute inset-0 bg-accent/60" />
          <span className="absolute inset-0 flex items-center justify-center px-[12%] text-center font-body text-[clamp(0.5rem,0.86vw,0.8125rem)] font-semibold leading-tight text-white">
            Customize best practices to various industries
          </span>
        </div>
      </div>
    </div>
  );
}
