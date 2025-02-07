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