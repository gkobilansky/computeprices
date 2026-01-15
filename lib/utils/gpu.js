import { supabase } from '@/lib/supabase';
import { siteConfig } from '@/app/metadata';
import { getGPUProviderCount } from '@/lib/utils/seoData';

export async function getGPUBySlug(slug) {
  try {
    const { data, error } = await supabase
      .from('gpu_models')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      // PGRST116 is Postgrest's error code for "no rows returned" when using .single()
      if (error.code === 'PGRST116') {
        return null;
      }
      // For other errors, log them but still return null
      console.error('Error fetching GPU by slug:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getGPUBySlug:', error);
    return null;
  }
}

export async function generateGPUMetadata(gpu) {
  if (!gpu) return {};

  // Get real provider count and price data for this GPU
  const providerStats = await getGPUProviderCount(gpu.id);
  const providerCount = providerStats.providerCount;

  // Build dynamic title and description
  const priceInfo = providerStats.lowestPrice ? ` from $${providerStats.lowestPrice}/hr` : '';
  const title = `${gpu.name} GPU Pricing & Specs (Compare ${providerCount}+ Providers) | ComputePrices.com`;
  const description = `Compare ${gpu.name} GPU prices across ${providerCount}+ cloud providers${priceInfo}. ${gpu.vram}GB VRAM, ${gpu.architecture} architecture. Find the best rates for AI training and inference.`;
  const path = `/gpus/${gpu.slug}`;

  // Generate keywords based on GPU attributes
  const keywords = [
    gpu.name,
    `${gpu.name} GPU`,
    `${gpu.name} pricing`,
    `${gpu.name} cloud`,
    `${gpu.name} rental`,
    'GPU pricing',
    'cloud GPU',
    'ML GPU',
    'AI GPU',
    'machine learning GPU',
    gpu.manufacturer,
    gpu.architecture,
    `${gpu.vram}GB GPU`,
  ].filter(Boolean);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `${siteConfig.url}${path}`
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${path}`,
      siteName: siteConfig.name,
      images: [
        {
          url: gpu.image_url || '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${gpu.name} GPU Comparison`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [gpu.image_url || '/og-image.png'],
    },
  };
}

export async function getAllGPUSlugs() {
  try {
    const { data, error } = await supabase
      .from('gpu_models')
      .select('slug')
      .not('slug', 'is', null);

    if (error) {
      console.error('Error fetching GPU slugs:', error);
      return [];
    }

    return (data || [])
      .map(gpu => gpu.slug)
      .filter(slug => slug && slug.length > 0);
  } catch (error) {
    console.error('Error in getAllGPUSlugs:', error);
    return [];
  }
} 