import React from "react";
import Link from "next/link";
import Header from "@/components/header";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Urbanist } from "next/font/google";
import "./globals.css";
import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/toaster"

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontHeading = Urbanist({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GovGoose",
  description: "GovGoose",
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
    ],
  },
  openGraph: {
    title: "GovGoose",
    description: "GovGoose",
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: "Get permits done faster with GovGoose. GovGoose logo in bottom right corner",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "GovGoose",
    description: "GovGoose",
    images: ['/opengraph-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontHeading.variable}`}>
      <body className="font-sans">
        <Header />
        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
