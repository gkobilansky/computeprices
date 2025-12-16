'use client';

import Link from 'next/link';
import AnimatedNumber from './AnimatedNumber';
import PriceDropAlertSignup from './PriceDropAlertSignup';
import ProviderLogoScroller from './ProviderLogoScroller';

export default function HeroSection({ stats }) {
  return (
    <section className="max-w-4xl">
      {/* Main Headline */}
      <h1 className="text-5xl font-bold mb-4 leading-tight animate-fade-in-up">
        <span className="gradient-text-1">Save on GPU Costs</span>
        <span className="block text-3xl mt-2 text-gray-700 font-medium">
          Compare <AnimatedNumber value={stats.gpuCount} duration={1200} className="tabular-nums" /> GPUs across{' '}
          <AnimatedNumber value={stats.providerCount} duration={1200} className="tabular-nums" /> providers instantly
        </span>
      </h1>

      {/* Subheadline */}
      <p className="text-xl text-gray-600 mb-6 animate-fade-in-up animation-delay-100">
        Find the cheapest{' '}
        <Link href="/gpus/h100" className="text-primary hover:underline underline-offset-2 decoration-1 decoration-dotted">
          H100
        </Link>,{' '}
        <Link href="/gpus/a100pcie" className="text-primary hover:underline underline-offset-2 decoration-1 decoration-dotted">
          A100
        </Link>, and{' '}
        <Link href="/gpus/rtx4090" className="text-primary hover:underline underline-offset-2 decoration-1 decoration-dotted">
          RTX 4090
        </Link>{' '}
        rates in seconds.
        <strong className="text-gray-800 ml-1">Daily pricing from Lambda, Runpod, CoreWeave, AWS & <Link href="/providers" className="text-primary hover:underline underline-offset-2 decoration-1 decoration-dotted">more</Link>.</strong>
      </p>

      {/* Trust Indicators */}
      <div className="flex flex-wrap items-center gap-6 mb-6 text-sm text-gray-600 animate-fade-in-up animation-delay-200">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Updated daily
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <AnimatedNumber value={stats.providerCount} duration={1200} className="tabular-nums" /> providers monitored
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <AnimatedNumber value={stats.pricePointsChecked} duration={1500} suffix="+" className="tabular-nums" /> price points checked
        </div>
      </div>

      {/* Price Drop Alert Signup */}
      <div className="mb-6 animate-fade-in-up animation-delay-300">
        <PriceDropAlertSignup />
      </div>

      {/* Provider Logo Scroller */}
      <div className="animate-fade-in-up animation-delay-400">
        <ProviderLogoScroller />
      </div>
    </section>
  );
}
