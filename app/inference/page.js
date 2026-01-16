import { fetchLLMPrices, fetchLLMModels, fetchInferenceProviders, getInferenceStats } from '@/lib/utils/fetchLLMData';
import LLMComparisonTable from '@/components/LLMComparisonTable';
import LLMTopPicks from '@/components/LLMTopPicks';

export const metadata = {
  title: 'LLM API Pricing Comparison | ComputePrices',
  description: 'Compare inference API pricing across providers including OpenAI, Anthropic, Together AI, Fireworks AI, DeepInfra, and more. Find the best pay-per-token rates for GPT-4, Claude, Llama, and other LLM models.'
};

export const revalidate = 3600; // Revalidate every hour

export default async function InferencePage() {
  const [prices, models, providers, stats] = await Promise.all([
    fetchLLMPrices({}),
    fetchLLMModels(),
    fetchInferenceProviders(),
    getInferenceStats()
  ]);

  return (
    <main className="space-y-6 py-6">
      {/* Page Header - matches GPU page */}
      <header className="mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-1">
              LLM Pricing
            </h1>
            <p className="text-slate-600">
              Compare per-token rates across {stats.providerCount}+ providers and {stats.modelCount}+ LLM models
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse"></span>
              Updated daily
            </span>
          </div>
        </div>
      </header>

      {/* Top Picks Section - matches GPU page structure */}
      <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 lg:p-5" aria-label="Top LLM Picks">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-base lg:text-lg font-semibold text-slate-900 flex items-center gap-2">
            <span className="text-lg">💡</span>
            Top Picks Right Now
          </h2>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white text-slate-600 border border-slate-200">
            Click to filter table
          </span>
        </div>
        <LLMTopPicks prices={prices} />
      </section>

      {/* Table Section */}
      <LLMComparisonTable
        prices={prices}
        models={models}
        providers={providers}
      />

      {/* Info Section - restyled to match site design */}
      <section className="pt-8 space-y-6">
        <h2 className="text-xl lg:text-2xl font-bold text-slate-900">Understanding LLM Pricing</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-violet-200 hover:shadow-sm transition-all">
            <h3 className="text-base font-semibold text-slate-900 mb-2">Input vs Output Tokens</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              LLM APIs charge separately for input tokens (your prompts) and output tokens (model responses).
              Output tokens are usually 2-5x more expensive than input tokens.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-violet-200 hover:shadow-sm transition-all">
            <h3 className="text-base font-semibold text-slate-900 mb-2">Context Windows</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              The context window determines how much text a model can process at once.
              Larger context windows allow for longer conversations and document analysis.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-violet-200 hover:shadow-sm transition-all">
            <h3 className="text-base font-semibold text-slate-900 mb-2">Open vs Proprietary Models</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Open-source models (Llama, Mistral) are often cheaper but may require more tuning.
              Proprietary models (GPT-4, Claude) typically offer better out-of-box performance.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-violet-200 hover:shadow-sm transition-all">
            <h3 className="text-base font-semibold text-slate-900 mb-2">Batch Discounts</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Many providers offer 50% discounts for batch/async API usage.
              Consider batch APIs for non-time-sensitive workloads to reduce costs.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
