import { fetchLLMPrices, fetchLLMModels, fetchInferenceProviders } from '@/lib/utils/fetchLLMData';
import LLMComparisonTable from '@/components/LLMComparisonTable';

export const metadata = {
  title: 'LLM API Pricing Comparison | ComputePrices',
  description: 'Compare inference API pricing across providers including OpenAI, Anthropic, Together AI, Fireworks AI, DeepInfra, and more. Find the best pay-per-token rates for GPT-4, Claude, Llama, and other LLM models.'
};

export const revalidate = 3600; // Revalidate every hour

export default async function InferencePage() {
  const [prices, models, providers] = await Promise.all([
    fetchLLMPrices(),
    fetchLLMModels(),
    fetchInferenceProviders()
  ]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">LLM API Pricing Comparison</h1>
        <p className="text-gray-600">
          Compare pay-per-token pricing across {providers.length} inference API providers
          and {models.length} LLM models. Prices shown per 1M tokens.
        </p>
      </div>

      <LLMComparisonTable
        prices={prices}
        models={models}
        providers={providers}
      />

      {/* Info Section */}
      <section className="mt-16 space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Understanding LLM Pricing</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg border hover:border-primary transition-colors">
              <h3 className="text-xl font-medium mb-2">Input vs Output Tokens</h3>
              <p className="text-gray-600">
                LLM APIs typically charge separately for input tokens (your prompts) and output tokens (model responses).
                Output tokens are usually 2-5x more expensive than input tokens.
              </p>
            </div>
            <div className="p-6 rounded-lg border hover:border-primary transition-colors">
              <h3 className="text-xl font-medium mb-2">Context Windows</h3>
              <p className="text-gray-600">
                The context window determines how much text a model can process at once.
                Larger context windows allow for longer conversations and document analysis.
              </p>
            </div>
            <div className="p-6 rounded-lg border hover:border-primary transition-colors">
              <h3 className="text-xl font-medium mb-2">Open vs Proprietary Models</h3>
              <p className="text-gray-600">
                Open-source models (Llama, Mistral) are often cheaper but may require more tuning.
                Proprietary models (GPT-4, Claude) typically offer better out-of-box performance.
              </p>
            </div>
            <div className="p-6 rounded-lg border hover:border-primary transition-colors">
              <h3 className="text-xl font-medium mb-2">Batch Discounts</h3>
              <p className="text-gray-600">
                Many providers offer 50% discounts for batch/async API usage.
                Consider batch APIs for non-time-sensitive workloads to reduce costs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
