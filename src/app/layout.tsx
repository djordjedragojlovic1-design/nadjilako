import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { DemoSiteBanner } from "@/components/layout/DemoSiteBanner/DemoSiteBanner";
import { Footer } from "@/components/layout/Footer/Footer";
import { Navbar } from "@/components/layout/Navbar/Navbar";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NadjiLako",
    template: "%s | NadjiLako",
  },
  description:
    "Platforma za spajanje pružalaca usluga i klijenata u BiH, Srbiji, Hrvatskoj i Crnoj Gori.",
};

const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('nadjilako-theme');
    var dark = t === 'dark';
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sr"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <div className="bg-background sticky top-0 z-100">
                <DemoSiteBanner />
                <Navbar />
              </div>
              <main className="flex-1 w-full">{children}</main>
              <Footer />
            </div>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
