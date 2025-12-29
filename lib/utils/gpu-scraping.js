export function extractGPUModel(gpuName) {
    // Convert to uppercase for consistent matching
    const upperGPU = gpuName.toUpperCase();

  // === NVIDIA Blackwell Architecture (2024+) ===
  if (upperGPU.match(/\bGB200\b/i)) return 'GB200';
  if (upperGPU.match(/\bB200\b/i)) return 'B200';
  if (upperGPU.match(/\bB100\b/i)) return 'B100';

  // === NVIDIA Hopper Architecture ===
  if (upperGPU.includes('GH200')) return 'GH200';
  // H200 before H100 (more specific)
  if (upperGPU.match(/\bH200\b/i)) return 'H200';
  // H100 NVL variant
  if (upperGPU.match(/\bH100\s*NVL/i)) return 'H100 NVL';
  // H100 PCIe variant (40GB)
  if (upperGPU.match(/\bH100\s*PCIE/i) || upperGPU.match(/\bH100\s*40G/i)) return 'H100 PCIe';
  // H100 SXM (80GB default)
  if (upperGPU.match(/\bH100\s*SXM/i) || upperGPU.match(/\bH100\s*80G/i)) return 'H100 SXM';
  // Generic H100 defaults to SXM
  if (upperGPU.match(/\bH100\b/i)) return 'H100 SXM';

  // === AMD MI Series ===
  if (upperGPU.match(/\bMI355X\b/i)) return 'MI355X';
  if (upperGPU.match(/\bMI325X\b/i)) return 'MI325X';
  if (upperGPU.match(/\bMI300X\b/i)) return 'MI300X';
  if (upperGPU.match(/\bMI300A\b/i)) return 'MI300A';
  if (upperGPU.match(/\bMI250X\b/i)) return 'MI250X';
  if (upperGPU.match(/\bMI250\b/i) && !upperGPU.includes('MI250X')) return 'MI250';
  if (upperGPU.match(/\bMI210\b/i)) return 'MI210';
  if (upperGPU.match(/\bMI100\b/i)) return 'MI100';

  // === Intel GPUs ===
  if (upperGPU.match(/\bGAUDI\s*3\b/i)) return 'Gaudi 3';
  if (upperGPU.match(/\bGAUDI\s*2\b/i)) return 'Gaudi 2';
  if (upperGPU.match(/\bMAX\s*1550\b/i)) return 'Max 1550';
  if (upperGPU.match(/\bMAX\s*1100\b/i)) return 'Max 1100';

  // === NVIDIA Ada Lovelace ===
  // Handle RTX 6000 Ada case (with or without space)
  if (upperGPU.match(/\bRTX\s*6000\s*ADA/i)) return 'RTX 6000 ADA';
  // Handle RTX 5000 Ada
  if (upperGPU.match(/\bRTX\s*5000\s*ADA/i)) return 'RTX 5000 ADA';
  // Handle RTX 4500 Ada
  if (upperGPU.match(/\bRTX\s*4500\s*ADA/i)) return 'RTX 4500 ADA';
  // Handle RTX 4000 Ada (not A4000)
  if (upperGPU.match(/\bRTX\s*4000\s*ADA/i)) return 'RTX 4000 ADA';

  // Handle Ti/TI variants for 40-series
  if (upperGPU.match(/\bRTX\s*4090\s*TI/i)) return 'RTX 4090 Ti';
  if (upperGPU.match(/\bRTX\s*4080\s*SUPER/i)) return 'RTX 4080 SUPER';
  if (upperGPU.match(/\bRTX\s*4080\b/i)) return 'RTX 4080';
  if (upperGPU.match(/\bRTX\s*4070\s*TI\s*SUPER/i)) return 'RTX 4070 Ti SUPER';
  if (upperGPU.match(/\bRTX\s*4070\s*TI/i)) return 'RTX 4070 Ti';
  if (upperGPU.match(/\bRTX\s*4070\s*SUPER/i)) return 'RTX 4070 SUPER';
  if (upperGPU.match(/\bRTX\s*4070\b/i)) return 'RTX 4070';
  if (upperGPU.match(/\bRTX\s*4060\s*TI/i)) return 'RTX 4060 Ti';
  if (upperGPU.match(/\bRTX\s*4060\b/i)) return 'RTX 4060';

  // Handle Ti/TI variants for 30-series
  if (upperGPU.match(/\bRTX\s*3090\s*TI/i)) return 'RTX 3090 Ti';
  if (upperGPU.match(/\bRTX\s*3090\b/i)) return 'RTX 3090';
  if (upperGPU.match(/\bRTX\s*3080\s*TI/i)) return 'RTX 3080 Ti';
  if (upperGPU.match(/\bRTX\s*3080\b/i)) return 'RTX 3080';
  if (upperGPU.match(/\bRTX\s*3070\s*TI/i)) return 'RTX 3070 Ti';
  if (upperGPU.match(/\bRTX\s*3070\b/i)) return 'RTX 3070';

  // Handle L40S specifically
  if (upperGPU.match(/\bL40S\b/i)) return 'L40S';
  // Handle L40 (after L40S to avoid collision)
  if (upperGPU.match(/\bL40\b/i) && !upperGPU.match(/L40S/i)) return 'L40';

  // Handle RTX 4090 specifically
  if (upperGPU.match(/\bRTX\s*4090\b/i)) return 'RTX 4090';

  // Handle Tesla T4 specifically
  if (upperGPU.match(/\b(TESLA\s*)?T4\b/i)) return 'Tesla T4';

  // === NVIDIA Ampere Data Center ===
  // Handle A100 variants
  if (upperGPU.match(/\bA100_80G\b/i) || upperGPU.match(/\bA100\s*80G/i) || upperGPU.match(/\bA100\s*SXM/i)) return 'A100 SXM';
  if (upperGPU.match(/\bA100\s*40G/i) || upperGPU.match(/\bA100\s*PCIE/i)) return 'A100 PCIe';
  if (upperGPU.match(/\bA100\b/i)) return 'A100';  // Generic A100

  // Handle A30
  if (upperGPU.match(/\bA30\b/i) && !upperGPU.match(/A300/i)) return 'A30';
  // Handle A16
  if (upperGPU.match(/\bA16\b/i)) return 'A16';
  // Handle A2
  if (upperGPU.match(/\bA2\b/i) && !upperGPU.match(/A2[0-9]/i)) return 'A2';

  // Handle RTX 6000 (without Ada) - ensure space is included
  if (upperGPU.match(/\bRTX\s*6000\b/i) && !upperGPU.match(/ADA/i)) return 'RTX 6000 Ada';

  // Handle L4 specifically (don't confuse with L40)
  if (upperGPU.match(/\bL4\b/i) && !upperGPU.match(/L40/i)) return 'L4';

  // Handle A4000 specifically (don't confuse with A40)
  if (upperGPU.match(/\bA4000\b/i)) return 'RTX A4000';

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
    .replace(/\s*\d+\s*GB\b/gi, '') // Remove memory size (e.g., "24GB", "80 GB")
    .replace(/\s*SXM\d*/gi, '') // Remove SXM form factor
    .replace(/\s*PCI-?E\b/gi, '') // Remove PCIe references
    .replace(/\s+/g, ''); // Remove all remaining spaces
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