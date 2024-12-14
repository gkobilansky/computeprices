export default function GPUInfoCard({ selectedGPU }) {
  if (!selectedGPU) {
    return (
      <div className="p-4 bg-base-200 rounded-lg shadow-md">
        <p className="text-center text-gray-500">Select a GPU for more info</p>
      </div>
    );
  }

  const { name, description, vram, cudaCores, usage, cost } = selectedGPU;

  return (
    <div className="p-4 bg-base-200 rounded-lg shadow-md">
      <h3 className="font-bold text-lg">{name}</h3>
      <p>{description}</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>{vram}</li>
        <li>{cudaCores}</li>
        <li>{usage}</li>
        <li>{cost}</li>
      </ul>
    </div>
  );
} 