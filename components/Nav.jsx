'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/gpu', label: 'GPU Pricing' },
    { href: '/inference', label: 'LLM Pricing' },
    { href: '/providers', label: 'Providers' },
    { href: '/gpus', label: 'GPUs' },
    { href: '/learn', label: 'Learn' },
    { href: '/blog', label: 'Blog' }
  ];

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="py-5">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2.5">
          <Image
            src="/android-chrome-192x192.png"
            alt="Compute Prices Logo"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <span className="text-lg font-semibold text-slate-900">Compute Prices</span>
        </Link>

        <div className="flex items-center space-x-6">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm px-3 py-2 rounded-lg transition-colors ${
                  isActive(link.href)
                    ? 'text-emerald-700 bg-emerald-50 font-medium'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm px-3 py-2 rounded-lg transition-colors ${
                  isActive(link.href)
                    ? 'text-emerald-700 bg-emerald-50 font-medium'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
} 
