import LandingHero from '@/components/landing/LandingHero';
import LandingCTAs from '@/components/landing/LandingCTAs';
import LandingCharts from '@/components/landing/LandingCharts';
import LandingPriceTrends from '@/components/landing/LandingPriceTrends';
import { generateMetadata as generateBaseMetadata } from './metadata';
import { getHomepageStats, fetchGPUPrices } from '@/lib/utils/fetchGPUData';
import { getInferenceStats, fetchLLMPrices } from '@/lib/utils/fetchLLMData';

export async function generateMetadata() {
  const title = 'Compare Cloud AI Pricing: GPUs & LLM APIs | ComputePrices.com';
  const description = 'Compare cloud GPU prices and LLM inference API rates across all major providers. Find the best deals for H100, A100, GPT-5, Claude, and more.';

  return generateBaseMetadata({
    title,
    description,
    path: '/'
  });
}

// Get combined stats for the landing page
async function getLandingStats() {
  const [gpuStats, llmStats] = await Promise.all([
    getHomepageStats(),
    getInferenceStats()
  ]);

  return {
    gpuProviderCount: gpuStats.providerCount || 0,
    gpuModelCount: gpuStats.gpuCount || 0,
    llmProviderCount: llmStats.providerCount || 0,
    llmModelCount: llmStats.modelCount || 0
  };
}

// Get price ranges for charts
async function getPriceRanges() {
  try {
    const [gpuPrices, llmPrices] = await Promise.all([
      fetchGPUPrices(),
      fetchLLMPrices({})
    ]);

    // Calculate GPU price ranges by model
    const gpuByModel = new Map();
    for (const price of gpuPrices || []) {
      const name = price.gpu_model_name;
      if (!gpuByModel.has(name)) {
        gpuByModel.set(name, { name, minPrice: price.price_per_hour, maxPrice: price.price_per_hour });
      } else {
        const existing = gpuByModel.get(name);
        existing.minPrice = Math.min(existing.minPrice, price.price_per_hour);
        existing.maxPrice = Math.max(existing.maxPrice, price.price_per_hour);
      }
    }

    // Get top 5 GPUs by popularity (most price entries)
    const gpuCounts = new Map();
    for (const price of gpuPrices || []) {
      gpuCounts.set(price.gpu_model_name, (gpuCounts.get(price.gpu_model_name) || 0) + 1);
    }
    const topGPUs = Array.from(gpuCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => gpuByModel.get(name))
      .filter(Boolean);

    // Calculate LLM price ranges by model
    const llmByModel = new Map();
    for (const price of llmPrices || []) {
      const name = price.model_name;
      if (!llmByModel.has(name)) {
        llmByModel.set(name, {
          name,
          minInput: parseFloat(price.price_per_1m_input),
          maxOutput: parseFloat(price.price_per_1m_output)
        });
      } else {
        const existing = llmByModel.get(name);
        existing.minInput = Math.min(existing.minInput, parseFloat(price.price_per_1m_input));
        existing.maxOutput = Math.max(existing.maxOutput, parseFloat(price.price_per_1m_output));
      }
    }

    // Get top 5 LLMs
    const llmCounts = new Map();
    for (const price of llmPrices || []) {
      llmCounts.set(price.model_name, (llmCounts.get(price.model_name) || 0) + 1);
    }
    const topLLMs = Array.from(llmCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => llmByModel.get(name))
      .filter(Boolean);

    return {
      gpuPriceRange: topGPUs,
      llmPriceRange: topLLMs
    };
  } catch (error) {
    console.error('Error fetching price ranges:', error);
    return {
      gpuPriceRange: [],
      llmPriceRange: []
    };
  }
}

export default async function Home() {
  const [stats, priceRanges] = await Promise.all([
    getLandingStats(),
    getPriceRanges()
  ]);

  return (
    <>
      <div className="py-8 lg:py-12">
        {/* Hero Section with Stats */}
        <LandingHero stats={stats} />

        {/* CTA Cards */}
        <LandingCTAs />

        {/* Price Range Charts */}
        <LandingCharts
          gpuPriceRange={priceRanges.gpuPriceRange}
          llmPriceRange={priceRanges.llmPriceRange}
        />

        {/* GPU Price Trends */}
        <LandingPriceTrends />
      </div>

      {/* WebSite Schema */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
      >
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Compute Prices",
          "url": "https://computeprices.com",
          "description": "Compare cloud GPU prices and LLM inference API rates for machine learning and AI workloads",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://computeprices.com/gpus?search={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        })}
      </script>

      {/* Organization Schema */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
      >
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Compute Prices",
          "url": "https://computeprices.com",
          "logo": "https://computeprices.com/cp-logo.svg",
          "sameAs": [
            "https://twitter.com/flowathletics"
          ],
          "knowsAbout": [
            "Cloud Computing",
            "GPU Computing",
            "Machine Learning",
            "Artificial Intelligence",
            "Cloud GPU Pricing",
            "LLM Inference APIs"
          ]
        })}
      </script>
    </>
  );
}
