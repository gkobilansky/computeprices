import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react"
import "./globals.css";
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "GPU Comparison | Find the Perfect GPU for ML/AI",
  description: "Compare cloud GPU specifications and pricing to find the most cost-effective option for your machine learning workloads",
  keywords: ["GPU comparison", "cloud GPU", "ML GPU", "AI GPU", "machine learning", "GPU pricing", "compute prices", "compute costs", "cloud compute", "cloud compute providers"],
  authors: [{ name: "Lansky Tech" }],
  creator: "Lansky Tech",
  publisher: "Lansky Tech",
  // Favicon
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/cp-logo.svg", type: "image/svg" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png" },
    ],
  },
  // Open Graph
  openGraph: {
    title: "GPU Comparison | Find the Perfect GPU for ML/AI",
    description: "Compare cloud GPU specifications and pricing to find the most cost-effective option for your machine learning workloads",
    url: "https://computeprices.com",
    siteName: "Compute Prices",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GPU Comparison Tool",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "GPU Comparison | Find the Perfect GPU for ML/AI",
    description: "Compare cloud GPU specifications and pricing to find the most cost-effective option for your machine learning workloads",
    images: ["/og-image.png"],
    creator: "@flowathletics",
  },
  // Verification for search engines (if needed)
  verification: {
    google: "your-google-verification-code",
    // other verification codes as needed
  },
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
