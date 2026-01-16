'use client';

import ProviderLogoScroller from '@/components/ProviderLogoScroller';
import PriceDropAlertSignup from '@/components/PriceDropAlertSignup';

export default function LandingHero({ stats }) {
  const totalProviders = stats.gpuProviderCount + stats.llmProviderCount;
  const totalModels = stats.gpuModelCount + stats.llmModelCount;

  return (
    <section className="max-w-5xl mx-auto">
      {/* Main Headline */}
      <div className="text-center mb-8">
        <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight animate-fade-in-up">
          <span className="gradient-text-1">Compare Cloud AI Pricing</span>
        </h1>
        <p className="text-xl text-slate-600 mb-6 max-w-2xl mx-auto animate-fade-in-up animation-delay-100">
          Find the best prices for GPU compute and LLM inference APIs across all major cloud providers
        </p>
      </div>

      {/* Provider Logo Scroller */}
      <div className="animate-fade-in-up animation-delay-200 mb-8">
        <ProviderLogoScroller />
      </div>

      {/* Trust Indicators */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-sm text-slate-600 animate-fade-in-up animation-delay-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          Updated daily
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {totalProviders}+ providers
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          {totalModels}+ models tracked
        </div>
      </div>

      {/* Email Signup */}
      <div className="max-w-md mx-auto mb-10 animate-fade-in-up animation-delay-400">
        <PriceDropAlertSignup />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 max-w-4xl mx-auto animate-fade-in-up animation-delay-500">
        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 lg:p-5 text-center">
          <div className="text-2xl lg:text-3xl font-bold text-blue-600">
            {stats.gpuProviderCount}+
          </div>
          <div className="text-sm text-slate-600 mt-1">GPU Providers</div>
        </div>

        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 lg:p-5 text-center">
          <div className="text-2xl lg:text-3xl font-bold text-blue-600">
            {stats.gpuModelCount}+
          </div>
          <div className="text-sm text-slate-600 mt-1">GPU Models</div>
        </div>

        <div className="bg-violet-50/70 border border-violet-100 rounded-xl p-4 lg:p-5 text-center">
          <div className="text-2xl lg:text-3xl font-bold text-violet-600">
            {stats.llmProviderCount}+
          </div>
          <div className="text-sm text-slate-600 mt-1">LLM Providers</div>
        </div>

        <div className="bg-violet-50/70 border border-violet-100 rounded-xl p-4 lg:p-5 text-center">
          <div className="text-2xl lg:text-3xl font-bold text-violet-600">
            {stats.llmModelCount}+
          </div>
          <div className="text-sm text-slate-600 mt-1">LLM Models</div>
        </div>
      </div>
    </section>
  );
}
