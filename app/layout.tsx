import type { Metadata } from "next";
import { Geist, Geist_Mono, Lato } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "Spotify Strava Dashboard",
  description: "Spotify and Strava activity dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${lato.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="text-white flex flex-col min-h-screen">
        <nav className="bg-black/80 border-b border-dark sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4 flex gap-8">
            <Link href="/" className="text-spotify-green font-bold text-base hover:opacity-80">
              Home
            </Link>
            <Link href="/plays" className="text-spotify-green font-bold text-base hover:opacity-80">
              Plays
            </Link>
            <Link href="/runs" className="text-spotify-green font-bold text-base hover:opacity-80">
              Runs
            </Link>
            <Link href="/insights" className="text-spotify-green font-bold text-base hover:opacity-80">
              Insights
            </Link>
          </div>
        </nav>
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
