import Link from 'next/link';

export default function GPUGuide() {
  return (
    <div className="prose max-w-none p-6 card bg-base-100 shadow-lg border border-gray-300">
      <div className="card-body">
        <h2 className="card-title text-3xl font-extrabold mb-6 text-primary">Choosing the Right GPU for AI/ML Workloads</h2>
        <p className="mb-6 text-gray-700">
          Selecting the right GPU for your AI/ML tasks can be daunting, given the myriad of options available. This guide will walk you through the key specifications to consider and help you make an informed decision.
        </p>
        
        <h3 className="text-2xl font-semibold mb-4 text-secondary">Key Specifications to Consider</h3>
        <p className="mb-6 text-gray-700">
          When evaluating GPUs, it's essential to focus on a few critical specifications that will impact your workload's performance.
        </p>
        <ul className="list-disc list-inside mb-6 text-gray-700">
          <li className="mb-3">
            <strong>VRAM (Memory):</strong> 
            <p className="ml-5">
              The most critical spec for large language models. More VRAM allows for larger models and batch sizes. A minimum of 24GB is recommended for most modern LLMs.
            </p>
          </li>
          <li className="mb-3">
            <strong>Architecture:</strong> 
            <p className="ml-5">
              The architecture of the GPU can significantly impact performance. For example, the A100 uses the Ampere architecture, which is more efficient than the older Volta architecture used in the V100. 👉 <Link className="text-blue-500 hover:underline" href="/learn">Learn more about GPUs</Link>.
            </p>
          </li>
          <li className="mb-3">
            <strong>Price-to-Performance Ratio:</strong> 
            <p className="ml-5">
              Balancing cost and performance is crucial. The RTX 4090 typically offers the best value for individuals or small teams, while A100s and H100s provide maximum performance at premium prices.
            </p>
          </li>
        </ul>

        <h3 className="text-2xl font-semibold mb-4 text-secondary">Popular GPU Tiers</h3>
        <p className="mb-6 text-gray-700">
          Depending on your needs and budget, different GPU tiers may be more suitable. Here's a breakdown of popular options:
        </p>
        <ul className="list-disc list-inside mb-6 text-gray-700">
          <li className="mb-3">
            <strong>Entry Level ML/AI:</strong> 
            <p className="ml-5">
              <Link className="text-blue-500 hover:underline" href="/gpus/rtx4090">RTX 4090</Link> - Offers the best value proposition for those starting in AI/ML.
            </p>
          </li>
          <li className="mb-3">
            <strong>Professional:</strong> 
            <p className="ml-5">
              <Link className="text-blue-500 hover:underline" href="/gpus/rtxa6000">RTX A6000</Link> - Provides a good balance of performance and cost, ideal for professional use.
            </p>
          </li>
          <li className="mb-3">
            <strong>Enterprise:</strong> 
            <p className="ml-5">
              <Link className="text-blue-500 hover:underline" href="/gpus/a100">A100</Link> - Known for high performance and wide availability, suitable for enterprise-level tasks.
            </p>
          </li>
          <li className="mb-3">
            <strong>Top Tier:</strong> 
            <p className="ml-5">
              <Link className="text-blue-500 hover:underline" href="/gpus/h200">H200</Link> - Delivers maximum performance but has limited availability, perfect for cutting-edge research.
            </p>
          </li>
        </ul>
        <p className="mb-6 text-gray-700">
          By understanding these specifications and tiers, you can better align your GPU choice with your specific AI/ML needs. Remember, the right GPU can significantly enhance your productivity and efficiency.
        </p>
      </div>
    </div>
  );
} 