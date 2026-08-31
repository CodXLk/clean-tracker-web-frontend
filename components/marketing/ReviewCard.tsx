import { MapPin, Star, User } from "lucide-react";

/** Placeholder review card — see lib/constants/reviews.ts for the "no real reviews yet" note. */
export function ReviewCard({ role, className = "w-[320px] shrink-0" }: { role: string; className?: string }) {
    return (
        <li className={`flex flex-col gap-8 rounded-xl border border-line bg-white p-6 ${className}`}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-line bg-surface-muted text-body-2">
                        <User size={22} aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-lg text-ink">[Client name]</p>
                        <p className="text-sm text-body-2">{role} — [service type]</p>
                    </div>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-sm text-body-2">
                    <Star size={16} className="fill-brand-2 text-brand-2" aria-hidden="true" />
                </span>
            </div>

            <p className="flex-1 text-sm text-body-2">&ldquo;[Client testimonial to be added]&rdquo;</p>

            <div className="flex flex-col gap-4 border-t border-line pt-4">
                <div className="flex items-center justify-between text-sm text-body-2">
                    <span className="flex items-center gap-1">
                        <MapPin size={16} aria-hidden="true" />
                        [Suburb], [State]
                    </span>
                    <span>[Date]</span>
                </div>
            </div>
        </li>
    );
}
