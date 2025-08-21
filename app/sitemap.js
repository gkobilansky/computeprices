import { getAllGPUSlugs } from '@/lib/utils/gpu';
import { getAllProviderSlugs } from '@/lib/utils/provider';
import { generateCanonicalComparisonURL } from '@/lib/providers';

export default async function sitemap() {
  const baseUrl = 'https://computeprices.com';

  // Static pages are always available
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/gpus`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/providers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/learn`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  try {
    // Try to get dynamic pages
    const [gpuSlugs = [], providerSlugs = []] = await Promise.allSettled([
      getAllGPUSlugs().catch(() => []),
      getAllProviderSlugs().catch(() => []),
    ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : []));

    // GPU pages
    const gpuPages = gpuSlugs.map(slug => ({
      url: `${baseUrl}/gpus/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    // Provider pages
    const providerPages = providerSlugs.map(slug => ({
      url: `${baseUrl}/providers/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    // Generate comparison pages (all possible provider combinations)
    const comparisonPages = [];
    const maxComparisons = 50; // Limit to avoid too many sitemap entries
    let comparisonCount = 0;

    // High-priority comparisons (major cloud providers)
    const priorityProviders = ['aws', 'google', 'azure', 'coreweave', 'runpod', 'lambda', 'vast'];
    const priorityProvidersInData = providerSlugs.filter(slug => priorityProviders.includes(slug));

    for (let i = 0; i < priorityProvidersInData.length && comparisonCount < maxComparisons; i++) {
      for (let j = i + 1; j < priorityProvidersInData.length && comparisonCount < maxComparisons; j++) {
        const provider1 = priorityProvidersInData[i];
        const provider2 = priorityProvidersInData[j];
        
        comparisonPages.push({
          url: generateCanonicalComparisonURL(provider1, provider2, baseUrl),
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.9, // Higher priority for major provider comparisons
        });
        comparisonCount++;
      }
    }

    // Add remaining provider comparisons with lower priority
    const remainingProviders = providerSlugs.filter(slug => !priorityProviders.includes(slug));
    for (let i = 0; i < remainingProviders.length && comparisonCount < maxComparisons; i++) {
      for (let j = i + 1; j < remainingProviders.length && comparisonCount < maxComparisons; j++) {
        const provider1 = remainingProviders[i];
        const provider2 = remainingProviders[j];
        
        comparisonPages.push({
          url: generateCanonicalComparisonURL(provider1, provider2, baseUrl),
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
        comparisonCount++;
      }
    }

    // Mix priority and remaining providers for additional comparisons
    for (let i = 0; i < priorityProvidersInData.length && comparisonCount < maxComparisons; i++) {
      for (let j = 0; j < Math.min(3, remainingProviders.length) && comparisonCount < maxComparisons; j++) {
        const provider1 = priorityProvidersInData[i];
        const provider2 = remainingProviders[j];
        
        comparisonPages.push({
          url: generateCanonicalComparisonURL(provider1, provider2, baseUrl),
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
        comparisonCount++;
      }
    }

    console.log(`Generated ${comparisonPages.length} comparison pages for sitemap`);

    return [...staticPages, ...gpuPages, ...providerPages, ...comparisonPages];
  } catch (error) {
    console.error('Error generating dynamic sitemap entries:', error);
    // Return static pages if dynamic page generation fails
    return staticPages;
  }
} 