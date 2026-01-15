import { generateMetadata as generateBaseMetadata } from '@/app/metadata';
import { getSEOStats } from '@/lib/utils/seoData';

export async function generateMetadata() {
  const stats = await getSEOStats();
  const gpuList = stats.popularGPUs.slice(0, 4).join(', ');

  const title = `${stats.activeGpuCount}+ Cloud GPUs: Specs, Pricing & Use Cases | ComputePrices.com`;
  const description = `Compare ${stats.activeGpuCount}+ GPU models including ${gpuList}. View specs, cloud pricing from $${stats.lowestPrice}/hr across ${stats.activeProviderCount}+ providers. Find the best GPU for AI, ML, and deep learning.`;

  return generateBaseMetadata({
    title,
    description,
    path: '/gpus'
  });
}

export default function GPUsLayout({ children }) {
  return children;
}
