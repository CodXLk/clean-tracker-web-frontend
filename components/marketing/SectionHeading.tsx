import { cn } from "@/lib/utils/cn";

interface SectionHeadingProps extends React.ComponentPropsWithoutRef<"h2"> {
  /** Leading words, rendered in near-black. */
  lead: string;
  /** Trailing words, rendered in the Primeway accent orange. */
  accent: string;
  /** Rendered element — the hero owns the page's only `h1`. */
  as?: "h1" | "h2";
}

/**
 * The two-tone 55px Plus Jakarta Sans Bold heading Figma uses for every section
 * title ("Who We Are?", "Our Services", "Industries We Serve", "Why Choose Us?").
 */
export function SectionHeading({
  lead,
  accent,
  as: Tag = "h2",
  className,
  ...rest
}: SectionHeadingProps) {
  return (
    <Tag
      {...rest}
      className={cn(
        "font-heading text-section font-bold leading-tight text-black",
        className,
      )}
    >
      {lead} <span className="text-accent">{accent}</span>
    </Tag>
  );
}
