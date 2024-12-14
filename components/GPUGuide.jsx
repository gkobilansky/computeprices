export default function GPUGuide() {
  return (
    <div className="prose max-w-none">
      <h2>GPU Guide for AI/ML Workloads</h2>
      
      <h3>Key Specifications to Consider</h3>
      <ul>
        <li>
          <strong>VRAM (Memory)</strong>
          <ul>
            <li>Most critical spec for large language models</li>
            <li>More VRAM allows larger models and batch sizes</li>
            <li>24GB minimum recommended for most modern LLMs</li>
          </ul>
        </li>
        <li>
          <strong>CUDA Cores</strong>
          <ul>
            <li>More cores generally mean faster processing</li>
            <li>Newer architectures are more efficient</li>
          </ul>
        </li>
        <li>
          <strong>Price-to-Performance Ratio</strong>
          <ul>
            <li>RTX 4090 typically offers best value for individuals/small teams</li>
            <li>A100s/H100s provide maximum performance at premium prices</li>
          </ul>
        </li>
      </ul>

      <h3>Popular GPU Tiers</h3>
      <ul>
        <li>
          <strong>Entry Level ML/AI:</strong> RTX 4090 (24GB) - Best value proposition
        </li>
        <li>
          <strong>Professional:</strong> A6000 (48GB) - Good balance of performance/cost
        </li>
        <li>
          <strong>Enterprise:</strong> A100 (40GB/80GB) - High performance, widely available
        </li>
        <li>
          <strong>Top Tier:</strong> H100 (80GB) - Maximum performance, limited availability
        </li>
      </ul>
    </div>
  );
} 