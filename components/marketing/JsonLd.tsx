/** Renders a JSON-LD `<script>` block. `data` must describe only real, verifiable content — never fabricated reviews, prices or ratings. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
