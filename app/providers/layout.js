import { generateMetadata as generateBaseMetadata } from '@/app/metadata';
import { getSEOStats } from '@/lib/utils/seoData';

export async function generateMetadata() {
  const stats = await getSEOStats();
  const gpuList = stats.popularGPUs.slice(0, 2).join(' and ');

  const title = `${stats.activeProviderCount}+ GPU Cloud Providers Compared | ComputePrices.com`;
  const description = `Compare ${stats.activeProviderCount}+ cloud GPU providers. Find ${gpuList} pricing from $${stats.lowestPrice}/hr. Hyperscalers, neoclouds, and marketplace options reviewed.`;

  return generateBaseMetadata({
    title,
    description,
    path: '/providers'
  });
}

export default function ProvidersLayout({ children }) {
  return children;
}
