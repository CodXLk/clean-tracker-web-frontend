import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface IndustryCardProps {
  icon:      string;
  label:     string;
  color:     "teal" | "orange";
  className?: string;
}

export function IndustryCard({ icon, label, color, className }: IndustryCardProps) {
  return (
    <div
      data-industry-card
      className={cn(
        "group relative size-[130px] shrink-0 rotate-45 overflow-hidden rounded-2xl shadow-lg",
        color === "teal" ? "bg-primary" : "bg-[#ED5F25]",
        className,
      )}
    >
      {/* Resting state: icon + label */}
      <div className="absolute inset-0 flex -rotate-45 flex-col items-center justify-center gap-2 px-4 text-center transition-opacity duration-300 group-hover:opacity-0">
        <div className="relative size-8">
          <Image src={icon} alt="" fill sizes="32px" className="object-contain" />
        </div>
        <p className="font-['Inter'] text-[13px] font-semibold leading-tight text-white">{label}</p>
      </div>

      {/* Hover state: architectural photo + orange tint + caption */}
      <div className="absolute inset-0 -rotate-45 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="relative size-[184px] -translate-x-[27px] -translate-y-[27px]">
          <Image
            src="/images/marketing/industries/architectural-bg.jpg"
            alt=""
            fill
            sizes="184px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#ED5F25]/60" />
          <p className="absolute inset-0 flex items-center justify-center px-5 text-center font-['Inter'] text-[11px] font-semibold leading-tight text-white">
            Customize best practices to various industries
          </p>
        </div>
      </div>
    </div>
  );
}
