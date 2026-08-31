import { Minus, Plus } from "lucide-react";
import type { FaqItem } from "@/lib/constants/faq";

/** Native <details>/<summary> — accessible and crawlable without extra ARIA wiring. The first item is open by default. */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
    return (
        <div className="flex flex-col gap-4">
            {items.map((item, i) => (
                <details key={item.question} open={i === 0} className="group rounded-lg border border-line-2 px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink marker:content-none">
                        {item.question}
                        <span className="relative flex size-5 shrink-0 items-center justify-center text-brand-2">
                            <Plus size={18} className="absolute group-open:hidden" aria-hidden="true" />
                            <Minus size={18} className="absolute hidden group-open:block" aria-hidden="true" />
                        </span>
                    </summary>
                    <p className="mt-3 text-sm text-body-2">{item.answer}</p>
                </details>
            ))}
        </div>
    );
}
