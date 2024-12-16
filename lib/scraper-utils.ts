export function extractGPUModel(gpuName: string) {
  const modelPattern = /\b([A-H])?\d{2,4}[A-Za-z-]*\b/;
  const match = gpuName.match(modelPattern);
  return match ? match[0].toUpperCase() : null;
}

export async function findMatchingGPUModel(gpuName: string, existingModels: any[]) {
  const gpuModel = extractGPUModel(gpuName);
  if (!gpuModel) return null;

  return existingModels.find(model => {
    const existingModel = extractGPUModel(model.name);
    return existingModel === gpuModel;
  });
}

export function parseMemory(memoryStr: string) {
  const match = memoryStr.match(/(\d+(?:\.\d+)?)\s*(GB|GiB|TB)/i);
  if (!match) return null;
  
  const [_, value, unit] = match;
  const numValue = parseFloat(value);
  
  return unit.toLowerCase() === 'tb' ? numValue * 1024 : numValue;
} 