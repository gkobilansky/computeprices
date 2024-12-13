import { supabase } from '../lib/supabase.js';

const providers = [
  { name: 'Lambda Labs', website: 'https://lambdalabs.com' },
  { name: 'RunPod', website: 'https://runpod.io' },
  { name: 'Vast.ai', website: 'https://vast.ai' },
  { name: 'CoreWeave', website: 'https://coreweave.com' },
  { name: 'Genesis Cloud', website: 'https://genesiscloud.com' }
];

const gpuModels = [
  { name: 'A100 80GB', vram: 80, cuda_cores: 6912 },
  { name: 'A100 40GB', vram: 40, cuda_cores: 6912 },
  { name: 'H100', vram: 80, cuda_cores: 18432 },
  { name: 'A6000', vram: 48, cuda_cores: 10752 },
  { name: 'RTX 4090', vram: 24, cuda_cores: 16384 }
];

// Sample pricing data
const providerGpuData = [
  { provider: 'Lambda Labs', gpu: 'A100 80GB', price_per_hour: 1.99, regions: ['us-east', 'us-west'] },
  { provider: 'RunPod', gpu: 'A100 80GB', price_per_hour: 1.89, regions: ['us-east', 'eu-central'] },
  { provider: 'Vast.ai', gpu: 'RTX 4090', price_per_hour: 0.35, regions: ['us-east'] },
  // Add more realistic pricing data
];

async function seedData() {
  try {
    // Insert providers
    const { data: providerData, error: providerError } = await supabase
      .from('providers')
      .upsert(providers, { onConflict: 'name' })
      .select();

    if (providerError) throw providerError;
    console.log('✅ Providers seeded');

    // Insert GPU models
    const { data: gpuData, error: gpuError } = await supabase
      .from('gpu_models')
      .upsert(gpuModels, { onConflict: 'name' })
      .select();

    if (gpuError) throw gpuError;
    console.log('✅ GPU models seeded');

    // Create a map for easy lookup
    const providerMap = Object.fromEntries(
      providerData.map(p => [p.name, p.id])
    );
    const gpuMap = Object.fromEntries(
      gpuData.map(g => [g.name, g.id])
    );

    // Insert provider GPU pricing
    const providerGpus = providerGpuData.map(item => ({
      provider_id: providerMap[item.provider],
      gpu_model_id: gpuMap[item.gpu],
      price_per_hour: item.price_per_hour,
      regions: item.regions,
      available: true
    }));

    const { error: pricingError } = await supabase
      .from('provider_gpus')
      .upsert(providerGpus);

    if (pricingError) throw pricingError;
    console.log('✅ Provider GPU pricing seeded');

    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function if this file is executed directly
seedData();
