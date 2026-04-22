import { DM_Sans } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";
import clsx from "clsx";
import type { Metadata } from "next";
import { WEBSITE_JSONLD } from "@/lib/jsonld";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://new.confessio.fr"),
  title: "Confessio — Trouver une confession près de chez vous",
  description:
    "Trouvez les horaires de confession catholique près de chez vous. Lieux, horaires et informations pratiques.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Confessio",
  },
  twitter: {
    card: "summary",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content" as const,
};

export default function RootLayout({
  children,
  map,
  modal,
}: Readonly<{
  children: React.ReactNode;
  map: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={clsx(dmSans.variable, "antialiased")}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
        />
        <Providers>
          {children}
          {modal}
          {map}
        </Providers>
      </body>
    </html>
  );
}
