import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { BUSINESS } from "@/lib/constants/business";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

// Body copy across the marketing site is Inter in Figma.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BUSINESS.siteUrl),
  title: {
    default: `${BUSINESS.name} | Commercial Cleaning Across Australia`,
    template: `%s | ${BUSINESS.name}`,
  },
  description:
    `${BUSINESS.name} is a commercial cleaning company based in ${BUSINESS.addressRegion}, Australia, offering regular, deep, disinfecting, carpet and window cleaning across a wide range of industries.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} ${inter.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning is scoped to this element's own attributes only
          — it does not hide mismatches elsewhere in the tree. Needed because
          browser extensions (e.g. ColorZilla) inject attributes like
          cz-shortcut-listen onto <body> before React hydrates, which is a
          false-positive mismatch: the extension changed the DOM, not our code. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
