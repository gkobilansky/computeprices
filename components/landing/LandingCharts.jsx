'use client';

import Link from 'next/link';

export default function LandingCharts({ gpuPriceRange, llmPriceRange }) {
  return (
    <section className="py-8 lg:py-10">
      <h2 className="text-xl lg:text-2xl font-bold text-slate-900 text-center mb-6">
        Current Price Ranges
      </h2>

      <div className="grid md:grid-cols-2 gap-4 lg:gap-6 max-w-4xl mx-auto">
        {/* GPU Price Range */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-200 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
              GPU Hourly Rates
            </h3>
            <Link href="/gpu" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-2.5">
            {gpuPriceRange.map((gpu, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="text-slate-700 text-sm font-medium">{gpu.name}</span>
                <span className="text-slate-500 text-sm tabular-nums">
                  ${gpu.minPrice.toFixed(2)} - ${gpu.maxPrice.toFixed(2)}/hr
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* LLM Price Range */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-violet-200 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-violet-500 rounded-full"></span>
              LLM Per-Million Tokens
            </h3>
            <Link href="/inference" className="text-xs text-violet-600 hover:text-violet-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-2.5">
            {llmPriceRange.map((llm, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="text-slate-700 text-sm font-medium">{llm.name}</span>
                <span className="text-slate-500 text-sm tabular-nums">
                  ${llm.minInput.toFixed(2)} - ${llm.maxOutput.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
