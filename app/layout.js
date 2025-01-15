import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react"
import "./globals.css";
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { siteConfig, defaultMetadata, generateOpenGraph, generateTwitter } from './metadata';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  ...defaultMetadata,
  title: "GPU Comparison | Find the Perfect GPU for ML/AI",
  description: siteConfig.defaultDescription,
  keywords: ["GPU comparison", "cloud GPU", "ML GPU", "AI GPU", "machine learning", "GPU pricing", "compute prices", "compute costs", "cloud compute", "cloud compute providers"],
  authors: [{ name: siteConfig.creator }],
  creator: siteConfig.creator,
  publisher: siteConfig.creator,
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/cp-logo.svg", type: "image/svg" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png" },
    ],
  },
  openGraph: generateOpenGraph({
    title: "GPU Comparison | Find the Perfect GPU for ML/AI",
    description: siteConfig.defaultDescription
  }),
  twitter: generateTwitter({
    title: "GPU Comparison | Find the Perfect GPU for ML/AI",
    description: siteConfig.defaultDescription
  })
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" className="transition-colors duration-300">
      <body className={inter.className}>
        <Analytics />
        <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Nav />
            <main className="py-8">
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
