import { MapPin, Star } from "lucide-react";
import type { Review } from "@/lib/constants/reviews";

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export function ReviewCard({ review, className = "w-[320px] shrink-0" }: { review: Review; className?: string }) {
    const { name, role, serviceType, rating, quote, suburb, state, date } = review;

    return (
        <li className={`flex flex-col gap-8 rounded-xl border border-line bg-white p-6 ${className}`}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-line bg-surface-muted text-lg font-medium text-ink">
                        {getInitials(name)}
                    </span>
                    <div>
                        <p className="text-lg text-ink">{name}</p>
                        <p className="text-sm text-body-2">
                            {role} — {serviceType}
                        </p>
                    </div>
                </div>
                <span
                    className="flex shrink-0 items-center gap-0.5"
                    aria-label={`${rating} out of 5 stars`}
                >
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            size={16}
                            className={i < rating ? "fill-brand-2 text-brand-2" : "text-line"}
                            aria-hidden="true"
                        />
                    ))}
                </span>
            </div>

            <p className="flex-1 text-sm text-body-2">&ldquo;{quote}&rdquo;</p>

            <div className="flex flex-col gap-4 border-t border-line pt-4">
                <div className="flex items-center justify-between text-sm text-body-2">
                    <span className="flex items-center gap-1">
                        <MapPin size={16} aria-hidden="true" />
                        {suburb}, {state}
                    </span>
                    <span>{date}</span>
                </div>
            </div>
        </li>
    );
}
