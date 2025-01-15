import { getAllGPUSlugs } from '@/lib/utils/gpu';
import { getAllProviderSlugs } from '@/lib/utils/provider';

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

    return [...staticPages, ...gpuPages, ...providerPages];
  } catch (error) {
    console.error('Error generating dynamic sitemap entries:', error);
    // Return static pages if dynamic page generation fails
    return staticPages;
  }
} 