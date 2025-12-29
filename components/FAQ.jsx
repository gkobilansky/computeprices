'use client';

import { useState } from 'react';

const faqData = [
  {
    question: "What's the difference between spot instances and on-demand instances?",
    answer: "Spot instances offer 60-91% discounts compared to on-demand pricing, but can be interrupted with 30 seconds to 2 minutes notice when capacity is needed. On-demand instances provide guaranteed availability and persistent data storage at a premium. Spot is ideal for training workloads with checkpointing, while on-demand is better for production and critical workloads that can't be interrupted."
  },
  {
    question: "How much VRAM do I need for my machine learning workload?",
    answer: "VRAM requirements depend on your model size and task. Small models (basic CNNs) need 4-8GB, medium models (BERT, ResNet-50) need 12-16GB, and large language models (70B+ parameters) require 24GB or multiple GPUs. Training typically requires 2-4x more VRAM than inference. You can reduce requirements using quantization, gradient checkpointing, or smaller batch sizes."
  },
  {
    question: "What's the difference between A100, H100, and RTX 4090 GPUs?",
    answer: "H100 (Hopper architecture) is the newest, offering 3-6x faster LLM training than A100, priced at $4-8/hr. A100 (Ampere) provides excellent AI performance for research at $2-4/hr. RTX 4090 is a consumer GPU ideal for prototyping and small-scale ML at $0.18-0.35/hr. H100 and A100 have enterprise features like ECC memory and NVLink for multi-GPU scaling, while RTX 4090 is more cost-effective for individual workloads."
  },
  {
    question: "What are the hidden costs in GPU cloud computing?",
    answer: "Hidden costs can add 60-80% to your total spend. Watch for: data egress fees ($0.08-$0.12 per GB), storage costs for datasets and checkpoints ($0.10-$0.30 per GB monthly), idle GPU time (teams waste 30-50% on unused instances), cross-region transfer fees, and premium GPU surcharges. Always calculate total cost of ownership, not just hourly rates."
  },
  {
    question: "Training vs. inference: What GPU do I need for each?",
    answer: "Training requires powerful GPUs (A100, H100) with high VRAM and runs for hours or days, making it suitable for spot instances. Inference uses lighter GPUs (L4, A10, RTX series) with less VRAM and runs continuously, requiring on-demand reliability. Inference only loads 2 consecutive layers at a time, making it more memory-efficient per request."
  },
  {
    question: "How do I choose between hyperscalers (AWS/Azure/GCP) and specialized GPU providers?",
    answer: "Hyperscalers offer global availability, enterprise compliance, and integrated ecosystems, but cost 2-3x more with complex setup. Specialized providers like RunPod, Lambda, and CoreWeave are 40-60% cheaper with simpler setup but smaller ecosystems. Choose hyperscalers for enterprise compliance needs; choose specialized providers for cost-efficient ML workloads with simpler requirements."
  },
  {
    question: "What hourly rate should I expect for different GPU types?",
    answer: "2025 pricing ranges: H100 at $1.49-$6.98/hr (specialized providers $2-4, hyperscalers $4-8), H200 at $2.15-$6.00/hr, A100 80GB at $0.75-$4.00/hr, RTX 4090 at $0.18-$0.35/hr, and budget GPUs (L4, A10) at $0.33-$1.00/hr. Prices vary significantly by provider, region, and pricing model. Use ComputePrices to compare current rates across all providers."
  },
  {
    question: "How can I reduce my GPU cloud costs without sacrificing performance?",
    answer: "Key strategies: Right-size instances (use L4/A10 instead of H100 when sufficient), use spot instances with checkpointing for training (60-91% savings), optimize models with quantization and pruning, batch inference requests to improve utilization from 20-30% to 70-80%, auto-shutdown idle instances to eliminate 30-50% waste, and choose specialized providers over hyperscalers for 40-60% savings on comparable hardware."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12" aria-label="Frequently Asked Questions">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600">
            Common questions about GPU cloud pricing and specifications
          </p>
        </div>

        <div className="space-y-3">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="font-medium text-gray-900 pr-4">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// FAQ Schema for SEO - export for use in page
export function getFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}
