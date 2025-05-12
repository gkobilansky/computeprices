export function extractGPUModel(gpuName) {
    // Convert to uppercase for consistent matching
    const upperGPU = gpuName.toUpperCase();
    
  // Special cases
    if (upperGPU.includes('GH200')) return 'GH200';
  if (upperGPU.includes('MI300X')) return 'MI300X';
  if (upperGPU.includes('B200')) return 'B200';
    
  // Handle RTX 6000 Ada case (with or without space)
  if (upperGPU.match(/\bRTX\s*6000\s*ADA/i)) return 'RTX 6000 ADA';

  // Handle Ti/TI variants
  if (upperGPU.match(/\bRTX\s*3090\s*TI/i)) return 'RTX 3090 TI';

  // Handle L40S specifically
  if (upperGPU.match(/\bL40S\b/i)) return 'L40S';

  // Common GPU model patterns with improved regex
  const modelPattern = /\b(RTX\s*)?([A-HLV])\s*\d{1,4}(\s*[ST]i|\s+ADA)?(?:\s+\d+GB)?\b/i;
    const match = upperGPU.match(modelPattern);
    
    if (!match) return null;
    
  // Clean up the matched result
    return match[0]
      .replace(/\s+\d+GB$/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }
  
  export async function findMatchingGPUModel(gpuName, existingModels) {
  const extractedModel = extractGPUModel(gpuName);
  if (!extractedModel) return null;

  // First attempt: direct model name match
  const exactMatch = existingModels.find(model => {
    return extractGPUModel(model.name) === extractedModel;
  });

  if (exactMatch) return exactMatch;

  // Second attempt: Normalize and try again
  // Remove spaces, convert to uppercase for comparison
  const normalizedInput = extractedModel.replace(/\s+/g, '').toUpperCase();

  return existingModels.find(model => {
    const normalizedModel = model.name.replace(/\s+/g, '').toUpperCase();
    return normalizedModel === normalizedInput ||
      normalizedModel.includes(normalizedInput) ||
      normalizedInput.includes(normalizedModel);
  });
}

// Helper function to normalize GPU names for flexible matching
export function normalizeGPUName(name) {
  return name
    .toUpperCase()
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/(\d+)GB$/i, '') // Remove memory size
    .replace(/SXM\d+/i, '') // Remove SXM form factor
    .replace(/PCI-?E/i, ''); // Remove PCIe references
}

// Enhanced matching function that also considers VRAM size
export async function findMatchingGPUModelWithVRAM(gpuName, vramSize, existingModels) {
  // First try to match by model name
  const modelMatch = await findMatchingGPUModel(gpuName, existingModels);
  if (modelMatch) return modelMatch;

  // If no match but we know the VRAM size, try matching by normalized name + VRAM
  if (vramSize) {
    const normalizedInput = normalizeGPUName(gpuName);

    return existingModels.find(model => {
        // Match if the normalized name is similar AND VRAM matches
        const normalizedModel = normalizeGPUName(model.name);
        const sameFamily = normalizedModel.includes(normalizedInput) ||
          normalizedInput.includes(normalizedModel);

        return sameFamily && model.vram == vramSize;
      });
  }

  return null;
  }