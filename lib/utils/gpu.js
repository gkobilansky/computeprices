import { supabase } from '@/lib/supabase';

export function extractGPUModel(gpuName) {
  // Convert to uppercase for consistent matching
  const upperGPU = gpuName.toUpperCase();
  
  // Special case for GH200
  if (upperGPU.includes('GH200')) return 'GH200';
  
  // Common GPU model patterns:
  // - RTX A5000, A6000, A4000 (RTX A series)
  // - A100, H100, H200 (Data center GPUs)
  // - Tesla T4, V100 (Tesla series)
  // - RTX 4090, 4080, 3090 (Consumer RTX)
  // - A40, A10 (Professional GPUs)
  // - L40S (New data center GPUs)
  const modelPattern = /\b(RTX\s*)?((TESLA\s+)?[A-HLV])\s*\d{1,4}(\s*[ST]i|\s+ADA)?(?:\s+\d+GB)?\b/i;
  const match = upperGPU.match(modelPattern);
  
  if (!match) return null;
  
  // Clean up the matched result:
  // - Remove GB specifications
  // - Normalize spaces
  // - Remove memory specs
  return match[0]
    .replace(/\s+\d+GB$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

export async function findMatchingGPUModel(gpuName, existingModels) {
  const gpuModel = extractGPUModel(gpuName);
  if (!gpuModel) return null;

  // Find exact model number match
  return existingModels.find(model => {
    const existingModel = extractGPUModel(model.name);
    return existingModel === gpuModel;
  });
}

export async function getGPUBySlug(slug) {
  const { data, error } = await supabase
    .from('gpu_models')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
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