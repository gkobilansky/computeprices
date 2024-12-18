export default function GPUInfoCard({ selectedGPU }) {
  if (!selectedGPU) {
    return (
      <div className="card bg-base-200 shadow-md"><div className="card-body">Select a GPU for more info</div></div>
    );
  }

  const { name, description, vram, cudaCores, link } = selectedGPU;

  return (
    <div className="card bg-base-200 shadow-md">
      <div className="card-body">
        <h3 className="card-title">{name}</h3>
        <p>{description}</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>{vram}</li>
          <li>{cudaCores}</li>
        </ul>
        <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-4">
          Manufacturer Website
        </a>
      </div>
    </div>
  );
} 