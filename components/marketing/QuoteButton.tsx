import Link from "next/link";
import { Phone, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface QuoteButtonProps {
    href?: string;
    children?: React.ReactNode;
    className?: string;
    onClick?: () => void;
    icon?: LucideIcon;
}

/** The orange pill CTA with a trailing white icon circle, reused across the Figma redesign (Nav, Hero, section CTAs). */
export function QuoteButton({ href = "/contact", children = "Request a Quote", className, onClick, icon: Icon = Phone }: QuoteButtonProps) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "inline-flex shrink-0 items-center gap-4 rounded-full border border-white/15 bg-brand-2 py-1 pl-6 pr-1 text-sm font-medium whitespace-nowrap text-white shadow-sm transition-colors hover:bg-brand-2-dark",
                className,
            )}
        >
            {children}
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-2">
                <Icon size={16} aria-hidden="true" />
            </span>
        </Link>
    );
}
