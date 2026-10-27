import type { Metadata, Viewport } from "next";
import { Sora, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Cariockko",
  description: "Learn English through interactive conversations",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FAFAFA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try { const theme = localStorage.getItem("cariockko-theme"); const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches; if (theme === "dark" || (!theme && prefersDark)) document.documentElement.classList.add("dark"); } catch {}`,
          }}
        />
      </head>
      <body
        className={`${sora.variable} ${ibmPlexMono.variable} antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
