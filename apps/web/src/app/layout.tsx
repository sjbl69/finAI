import type { Metadata } from "next";

import "./globals.css";

import Providers from "./providers";

export const metadata: Metadata = {
  title: "FinAI",
  description:
    "Votre assistant intelligent pour gérer vos finances.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}