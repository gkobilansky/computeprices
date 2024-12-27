'use client';

import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';

export default function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/gpus', label: 'Why Cloud Compute?' },
    { href: '/learn', label: 'Learn to Use Those GPUs' },
    { href: '/cloud', label: 'All about Providers' },
  ];

  return (
    <nav className="py-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/cp-logo.svg"
            alt="Compute Prices Logo"
            width={48}
            height={48}
            priority
          />
          <span className="text-xl font-semibold">Compute Prices</span>
        </Link>

        <div className="flex items-center space-x-8">
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          <ThemeToggle />
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
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
        <div className="md:hidden mt-4 bg-base-200 rounded-lg p-4">
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm hover:text-primary transition-colors"
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