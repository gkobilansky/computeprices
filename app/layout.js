import { Inter } from "next/font/google";
import "./globals.css";
import ThemeToggle from '../components/ThemeToggle';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "GPU Comparison | Find the Perfect GPU for ML/AI",
  description: "Compare cloud GPU specifications and pricing to find the most cost-effective option for your machine learning workloads",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" className="transition-colors duration-300">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <a className="text-2xl font-bold gradient-text-1">GPU Compare</a>
                  <div className="hidden md:flex space-x-8 ml-12">
                    <a href="#pricing" className="text-sm hover:text-primary transition-colors">Pricing</a>
                    <a href="#guide" className="text-sm hover:text-primary transition-colors">Guide</a>
                    <a href="#about" className="text-sm hover:text-primary transition-colors">About</a>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <ThemeToggle />
                </div>
              </div>
            </nav>
            <main className="py-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
