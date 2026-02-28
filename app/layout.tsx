import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import "dialkit/styles.css";
import { DialRoot } from "dialkit";
import LoadingScreen from "./components/LoadingScreen";
import ScrollToTop from "./components/ScrollToTop";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "block",
});

export const metadata: Metadata = {
  title: "Versa Villa by ARYA",
  description:
    "Born from resilience, built for the future. A first-of-its-kind residence combining luxury architecture with advanced resilience.",
  openGraph: {
    title: "Versa Villa by ARYA",
    description:
      "Born from resilience, built for the future. A first-of-its-kind residence combining luxury architecture with advanced resilience.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Versa Villa by ARYA",
    description:
      "Born from resilience, built for the future. A first-of-its-kind residence combining luxury architecture with advanced resilience.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preload local fonts so they're ready before hero animations fire */}
        <link rel="preload" href="/fonts/AlteHaasGroteskRegular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className={`${playfair.variable} antialiased`}>
        {/* SSR loading screen — visible instantly before JS hydrates */}
        <div
          id="ssr-loading"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            backgroundColor: "#616D45",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/tree-blowing.svg"
            alt=""
            style={{
              height: "100px",
              width: "auto",
              filter: "brightness(0) invert(0.95) sepia(0.1) saturate(0.3)",
              animation: "ssr-tree-fade 0.6s ease-out forwards",
            }}
          />
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes ssr-tree-fade {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}} />
        </div>
        <ScrollToTop />
        <LoadingScreen />
        {children}
        {process.env.NODE_ENV === "development" && <DialRoot position="top-right" />}
      </body>
    </html>
  );
}
