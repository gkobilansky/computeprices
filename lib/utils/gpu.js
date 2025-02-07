import { supabase } from '@/lib/supabase';

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

  const title = `${gpu.name} GPU Pricing & Specs Comparison | Compute Prices`;
  const description = `Compare ${gpu.name} GPU prices across cloud providers. Find the best deals and specifications for ${gpu.name} instances for machine learning and AI workloads.`;

  return {
    title,
    description,
    keywords: [gpu.name, 'GPU pricing', 'cloud GPU', 'ML GPU', 'AI GPU', 'machine learning', gpu.name + ' cloud', gpu.name + ' pricing'],
    openGraph: {
      title,
      description,
      url: `https://computeprices.com/gpus/${gpu.slug}`,
      images: [
        {
          url: gpu.image_url || '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${gpu.name} GPU Comparison`,
        },
      ],
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
      .select('name')
      .not('name', 'is', null);

    if (error) {
      console.error('Error fetching GPU slugs:', error);
      return [];
    }

    return (data || [])
      .map(gpu => gpu.name.toLowerCase().replace(/\s+/g, '-'))
      .filter(slug => slug && slug.length > 0);
  } catch (error) {
    console.error('Error in getAllGPUSlugs:', error);
    return [];
  }
} 