import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface ServiceCardProps {
  image:        string;
  label:        string;
  ribbonColor:  string;
  rotationDeg:  number;
  className?:   string;
}

export function ServiceCard({ image, label, ribbonColor, rotationDeg, className }: ServiceCardProps) {
  return (
    <div
      data-service-card
      data-rotation={rotationDeg}
      className={cn(
        "relative h-[280px] w-[176px] shrink-0 overflow-hidden rounded-[36px] shadow-xl sm:h-[340px] sm:w-[214px]",
        className,
      )}
    >
      <Image src={image} alt={label} fill sizes="220px" className="object-cover" />
      <div
        className="absolute inset-x-0 bottom-0 flex h-[48px] items-center justify-center px-3 text-center sm:h-[56px]"
        style={{ backgroundColor: ribbonColor }}
      >
        <p className="font-heading text-xs font-bold text-white sm:text-sm">{label}</p>
      </div>
    </div>
  );
}
