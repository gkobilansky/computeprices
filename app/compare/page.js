import { getAllProviderSlugs, getProviderBySlug } from '@/lib/utils/provider';
import { fetchProviders } from '@/lib/utils/fetchGPUData';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ProviderSelector from '@/components/ProviderSelector';
import Image from 'next/image';
import Link from 'next/link';
import providersData from '@/data/providers.json';

export const metadata = {
  title: 'Compare Cloud GPU Providers | ComputePrices.com',
  description: 'Compare GPU pricing and features across all major cloud providers. Find the best deals on cloud GPUs for AI, ML, and high-performance computing.',
  keywords: ['GPU comparison', 'cloud GPU', 'provider comparison', 'AI GPU pricing', 'ML GPU costs'],
  openGraph: {
    title: 'Compare Cloud GPU Providers',
    description: 'Compare GPU pricing and features across all major cloud providers. Find the best deals on cloud GPUs for AI, ML, and high-performance computing.',
  }
};

async function getAllProviders() {
  // Get providers from both JSON data and database
  const dbProviders = await fetchProviders();
  
  // Combine and deduplicate providers
  const allProviders = [...providersData];
  
  // Add database-only providers
  dbProviders.forEach(dbProvider => {
    if (!allProviders.find(p => p.id === dbProvider.id)) {
      allProviders.push({
        id: dbProvider.id,
        name: dbProvider.name,
        slug: dbProvider.name.toLowerCase().replace(/\s+/g, '-'),
        description: "We're still gathering detailed info on this provider.",
        isMinimal: true
      });
    }
  });
  
  return allProviders.sort((a, b) => a.name.localeCompare(b.name));
}

function generateCombinations(providers) {
  const combinations = [];
  
  for (let i = 0; i < providers.length; i++) {
    for (let j = i + 1; j < providers.length; j++) {
      combinations.push([providers[i], providers[j]]);
    }
  }
  
  // Sort by provider names for consistent ordering
  return combinations.sort((a, b) => {
    const nameA = `${a[0].name} vs ${a[1].name}`;
    const nameB = `${b[0].name} vs ${b[1].name}`;
    return nameA.localeCompare(nameB);
  });
}

export default async function ComparePage() {
  const providers = await getAllProviders();
  const combinations = generateCombinations(providers);
  
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Compare Providers', href: '/compare' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      <BreadcrumbNav items={breadcrumbs} />

      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-bold mb-4">
          Compare Cloud GPU Providers
        </h1>
        <p className="text-gray-600 text-xl mb-8">
          Find the best GPU pricing and features by comparing providers side-by-side. 
          Choose any two providers to see detailed pricing comparisons.
        </p>
        <div className="stats bg-base-100 shadow-sm">
          <div className="stat">
            <div className="stat-title">Total Providers</div>
            <div className="stat-value text-primary">{providers.length}</div>
            <div className="stat-desc">Available comparisons: {combinations.length}</div>
          </div>
        </div>
      </section>

      {/* Provider Selection */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Choose Providers to Compare</h2>
        <ProviderSelector providers={providers} />
      </section>

      {/* Popular Comparisons */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Popular Comparisons</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {combinations.slice(0, 6).map(([provider1, provider2]) => (
            <div 
              key={`${provider1.id}-${provider2.id}`}
              className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <div className="card-body p-6">
                {/* Provider Logos */}
                <div className="flex justify-center items-center gap-4 mb-4">
                  {!provider1.isMinimal && (
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                      <Image 
                        src={`/logos/${provider1.slug}.png`} 
                        alt={`${provider1.name} logo`}
                        width={24} 
                        height={24} 
                        className="object-contain"
                      />
                    </div>
                  )}
                  
                  <span className="text-gray-400 font-bold text-lg">VS</span>
                  
                  {!provider2.isMinimal && (
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                      <Image 
                        src={`/logos/${provider2.slug}.png`} 
                        alt={`${provider2.name} logo`}
                        width={24} 
                        height={24} 
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>
                
                {/* Provider Names */}
                <h3 className="card-title text-center justify-center text-base mb-4">
                  {provider1.name} vs {provider2.name}
                </h3>
                
                {/* Compare Button */}
                <div className="card-actions justify-center">
                  <Link
                    href={`/compare/${provider1.slug}/${provider2.slug}`}
                    className="btn btn-primary btn-sm"
                  >
                    Compare Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {combinations.length > 6 && (
          <div className="text-center mt-8">
            <p className="text-gray-600">
              And {combinations.length - 6} more comparison combinations available.
              Visit individual provider pages to find comparison links.
            </p>
          </div>
        )}
      </section>

      {/* How to Compare Section */}
      <section className="bg-base-200 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">How to Compare Providers</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-primary text-white rounded-full flex items-center justify-center">
              <span className="font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2">Choose Providers</h3>
            <p className="text-gray-600 text-sm">
              Select two providers from the grid above or visit individual provider pages
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-primary text-white rounded-full flex items-center justify-center">
              <span className="font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2">Compare Pricing</h3>
            <p className="text-gray-600 text-sm">
              View side-by-side GPU pricing and availability for identical hardware
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-primary text-white rounded-full flex items-center justify-center">
              <span className="font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2">Make Decision</h3>
            <p className="text-gray-600 text-sm">
              Choose the best provider based on pricing, features, and your specific needs
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}