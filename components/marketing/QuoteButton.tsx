"use client";

import { cn } from "@/lib/utils/cn";

interface QuoteButtonProps {
  /** Anchor target — defaults to the quote form at the foot of the page. */
  href?: string;
  onNavigate?: (href: string) => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * The teal pill CTA from the Figma navbar: 55px tall, 100px radius, 20px
 * Plus Jakarta Sans ExtraBold, with the file's shared drop shadow
 * (0 10px 15px -3px rgba(0,0,0,0.1)).
 */
export function QuoteButton({
  href = "#contact",
  onNavigate,
  className,
  children = "Get a Quote",
}: QuoteButtonProps) {
  return (
    <a
      href={href}
      onClick={
        onNavigate
          ? (e) => {
              e.preventDefault();
              onNavigate(href);
            }
          : undefined
      }
      className={cn(
        "inline-flex h-[clamp(2.75rem,3.64vw,3.4375rem)] shrink-0 items-center justify-center",
        "rounded-full bg-primary px-[clamp(1rem,1.19vw,1.125rem)]",
        "font-heading text-[clamp(0.875rem,1.32vw,1.25rem)] font-extrabold whitespace-nowrap text-white",
        "shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] transition-[background-color,transform] duration-200",
        "hover:bg-primary-variant active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      {children}
    </a>
  );
}
