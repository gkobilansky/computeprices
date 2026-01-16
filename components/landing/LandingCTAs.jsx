'use client';

import Link from 'next/link';

export default function LandingCTAs() {
  return (
    <section className="grid md:grid-cols-2 gap-4 lg:gap-6 max-w-4xl mx-auto py-6">
      {/* GPU Pricing Card */}
      <Link
        href="/gpu"
        className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 lg:p-8 text-white hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold">GPU Pricing</h2>
          </div>
          <p className="text-blue-100 text-sm lg:text-base mb-5 leading-relaxed">
            Compare hourly rates for cloud GPUs. Find the best deals for H100, A100, RTX 4090, and more.
          </p>
          <div className="flex items-center gap-2 text-white font-semibold text-sm lg:text-base">
            Compare GPU Prices
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </Link>

      {/* LLM Pricing Card */}
      <Link
        href="/inference"
        className="group relative overflow-hidden bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-6 lg:p-8 text-white hover:shadow-xl hover:shadow-violet-500/20 transition-all duration-300 hover:scale-[1.02]"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold">LLM Pricing</h2>
          </div>
          <p className="text-violet-100 text-sm lg:text-base mb-5 leading-relaxed">
            Compare per-token rates for inference APIs. Find the best prices for GPT-4o, Claude, Llama, and more.
          </p>
          <div className="flex items-center gap-2 text-white font-semibold text-sm lg:text-base">
            Compare LLM Prices
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </Link>
    </section>
  );
}
