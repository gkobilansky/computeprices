export default function GPUGuide() {
  return (
    <div className="prose max-w-none p-4 card bg-base-200 shadow-md">
      <div className="card-body">
        <h2 className="card-title text-2xl font-bold mb-4">Choosing the Right GPU for AI/ML Workloads</h2>
        <p className="mb-4">
          Selecting the right GPU for your AI/ML tasks can be daunting, given the myriad of options available. This guide will walk you through the key specifications to consider and help you make an informed decision.
        </p>
        
        <h3 className="text-xl font-semibold mb-2">Key Specifications to Consider</h3>
        <p className="mb-4">
          When evaluating GPUs, it's essential to focus on a few critical specifications that will impact your workload's performance.
        </p>
        <ul className="list-disc list-inside mb-4">
          <li className="mb-2">
            <strong>VRAM (Memory):</strong> 
            <p className="ml-4">
              The most critical spec for large language models. More VRAM allows for larger models and batch sizes. A minimum of 24GB is recommended for most modern LLMs.
            </p>
          </li>
          <li className="mb-2">
            <strong>CUDA Cores:</strong> 
            <p className="ml-4">
              More cores generally mean faster processing. However, newer architectures are more efficient, so consider both the number of cores and the architecture.
            </p>
          </li>
          <li className="mb-2">
            <strong>Price-to-Performance Ratio:</strong> 
            <p className="ml-4">
              Balancing cost and performance is crucial. The RTX 4090 typically offers the best value for individuals or small teams, while A100s and H100s provide maximum performance at premium prices.
            </p>
          </li>
        </ul>

        <h3 className="text-xl font-semibold mb-2">Popular GPU Tiers</h3>
        <p className="mb-4">
          Depending on your needs and budget, different GPU tiers may be more suitable. Here's a breakdown of popular options:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li className="mb-2">
            <strong>Entry Level ML/AI:</strong> 
            <p className="ml-4">
              <em>RTX 4090 (24GB)</em> - Offers the best value proposition for those starting in AI/ML.
            </p>
          </li>
          <li className="mb-2">
            <strong>Professional:</strong> 
            <p className="ml-4">
              <em>A6000 (48GB)</em> - Provides a good balance of performance and cost, ideal for professional use.
            </p>
          </li>
          <li className="mb-2">
            <strong>Enterprise:</strong> 
            <p className="ml-4">
              <em>A100 (40GB/80GB)</em> - Known for high performance and wide availability, suitable for enterprise-level tasks.
            </p>
          </li>
          <li className="mb-2">
            <strong>Top Tier:</strong> 
            <p className="ml-4">
              <em>H100 (80GB)</em> - Delivers maximum performance but has limited availability, perfect for cutting-edge research.
            </p>
          </li>
        </ul>
        <p className="mb-4">
          By understanding these specifications and tiers, you can better align your GPU choice with your specific AI/ML needs. Remember, the right GPU can significantly enhance your productivity and efficiency.
        </p>
      </div>
    </div>
  );
} 