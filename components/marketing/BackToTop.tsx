"use client";

import { ArrowUp } from "lucide-react";

export function BackToTop() {
    return (
        <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white/75 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-2"
        >
            Back to top
            <ArrowUp size={14} aria-hidden="true" />
        </button>
    );
}
