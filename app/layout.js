import { Inter } from "next/font/google";
import "./globals.css";
import ThemeToggle from '../components/ThemeToggle';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "GPU Comparison",
  description: "Compare GPU specifications and performance",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" className="transition-colors duration-300">
      <body className={inter.className}>
        <div className="min-h-screen bg-base-100">
          <div className="container mx-auto px-4">
            <div className="navbar bg-base-100">
              <div className="flex-1">
                <a className="text-xl font-bold">GPU Comparison</a>
              </div>
              <div className="flex-none">
                <ThemeToggle />
              </div>
            </div>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
