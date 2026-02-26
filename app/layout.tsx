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
  title: "Versa Villa",
  description: "Versa Villa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} antialiased`}>
        <ScrollToTop />
        <LoadingScreen />
        {children}
        {process.env.NODE_ENV === "development" && <DialRoot position="top-right" />}
      </body>
    </html>
  );
}
