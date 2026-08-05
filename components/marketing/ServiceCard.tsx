import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/** Each service gets its own caption band colour, straight from Figma. */
const RIBBON_CLASS = {
  regular:    "bg-ribbon-regular",
  periodical: "bg-ribbon-periodical",
  deep:       "bg-ribbon-deep",
  specialist: "bg-ribbon-specialist",
} as const;

export type ServiceKey = keyof typeof RIBBON_CLASS;

/**
 * How each photo is framed inside its card, as percentages of the card box.
 * Figma crops all four differently — "Regular Cleaning" in particular is pushed
 * to roughly 1.76x — so a plain `object-cover` would show noticeably more of
 * every shot than the design does.
 */
const CROP: Record<ServiceKey, { width: number; height: number; left: number; top: number }> = {
  regular:    { width: 175.91, height: 166.25, left: -13.21, top: -0.09 },
  periodical: { width: 112.37, height: 106.20, left:  -5.46, top: -0.17 },
  deep:       { width: 112.99, height: 106.79, left: -13.79, top: -4.38 },
  specialist: { width: 120.79, height: 114.16, left: -13.21, top: -0.09 },
};

interface ServiceCardProps {
  image: string;
  label: string;
  service: ServiceKey;
  className?: string;
}

/**
 * A 249x395 photo card with a 50px radius and a caption band across its bottom
 * 61px, per Figma's Services scenes. Sized in `vw` off the 1512px design canvas
 * so the whole arrangement scales as one composition.
 */
export function ServiceCard({ image, label, service, className }: ServiceCardProps) {
  const crop = CROP[service];

  return (
    <div
      className={cn(
        "relative aspect-[249/395] w-[clamp(8.5rem,16.468vw,15.5625rem)] overflow-hidden",
        "rounded-[clamp(1.75rem,3.31vw,3.125rem)] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      <span
        className="absolute block"
        style={{
          width:  `${crop.width}%`,
          height: `${crop.height}%`,
          left:   `${crop.left}%`,
          top:    `${crop.top}%`,
        }}
      >
        <Image
          src={image}
          alt={label}
          fill
          sizes="(max-width: 1024px) 45vw, 18vw"
          className="object-cover"
        />
      </span>

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex h-[15.44%] items-center justify-center px-2",
          RIBBON_CLASS[service],
        )}
      >
        <p className="font-heading text-[clamp(0.6875rem,1.323vw,1.25rem)] font-bold whitespace-nowrap text-white">
          {label}
        </p>
      </div>
    </div>
  );
}
