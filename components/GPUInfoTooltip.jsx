export default function GPUInfoTooltip({ gpu, className }) {
  return (
    <div className={`absolute z-10 w-72 p-4 bg-base-200 rounded-lg shadow-xl -translate-y-full -translate-x-1/2 left-1/2 top-0 ${className}`}>
      <h3 className="font-bold mb-2">{gpu.name}</h3>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between">
          <dt>VRAM:</dt>
          <dd>{gpu.vram}GB</dd>
        </div>
      </dl>
    </div>
  );
} 