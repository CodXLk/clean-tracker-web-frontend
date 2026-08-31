import { cn } from "@/lib/utils/cn";

/** The small pill "eyebrow" label above every section heading in the redesign. */
export function SectionTag({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span
            className={cn(
                "inline-flex w-fit items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-body-2",
                className,
            )}
        >
            <span aria-hidden="true" className="size-1 rounded-full bg-brand-2" />
            {children}
        </span>
    );
}
