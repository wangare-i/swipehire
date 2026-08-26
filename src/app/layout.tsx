import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BottomNav from "@/components/BottomNav";
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
  title: "AjiraSwipe — Swipe your way to your next job",
  description: "A dating-app-style way to discover jobs and recruiters.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-neutral-950 text-neutral-100">
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col pb-24">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
