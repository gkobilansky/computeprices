# Provider Data Guidelines

This document defines what should and should not be included in provider JSON files located in `data/providers/`.

## Purpose

Provider JSON files contain **long-term, informational data** that helps customers evaluate and choose cloud GPU providers. This data should be relatively stable and not require frequent updates.

**Pricing data** (specific dollar amounts per hour/GPU) is handled separately through our automated scraping system and stored in the database.

## Core Principle

**Include:** Information that helps users understand WHY and HOW they might choose this provider
**Exclude:** Specific pricing data that changes frequently and is scraped automatically

---

## What TO Include ✅

### Required Fields

```json
{
  "id": "uuid-v4-here",
  "name": "Provider Name",
  "slug": "provider-slug",
  "description": "Brief description of the provider and their focus",
  "link": "https://provider.com",
  "hqCountry": "US",
  "tagline": "Short marketing tagline",
  "category": "Massive neocloud"
}
```

### Optional But Recommended Fields

#### 1. Features
Highlight key capabilities and differentiators:

```json
"features": [
  {
    "title": "Global Infrastructure",
    "description": "Extensive network of data centers across multiple regions worldwide"
  },
  {
    "title": "Auto Scaling",
    "description": "Automatically adjust resources based on demand"
  }
]
```

#### 2. Pros and Cons
Honest assessment to help users make informed decisions:

```json
"pros": [
  "Extensive selection of NVIDIA GPUs, including latest models",
  "Kubernetes-native infrastructure for easy scaling",
  "Specialized support for AI and ML workloads"
],
"cons": [
  "Primary focus on North American data centers",
  "Learning curve for users unfamiliar with Kubernetes",
  "Newer player compared to established cloud giants"
]
```

#### 3. Getting Started
Step-by-step onboarding guidance:

```json
"gettingStarted": [
  {
    "title": "Create an account",
    "description": "Sign up using email or GitHub account"
  },
  {
    "title": "Add payment method",
    "description": "Add a credit card or cryptocurrency payment"
  },
  {
    "title": "Launch your first instance",
    "description": "Select a template and GPU type"
  }
]
```

#### 4. Compute Services
Describe the types of services offered and their characteristics:

```json
"computeServices": [
  {
    "name": "GPU Instances",
    "description": "On-demand GPU VMs with self-service provisioning",
    "instanceTypes": [
      {
        "name": "NVIDIA H200 GPU",
        "description": "141 GB HBM H200 GPUs for memory-intensive workloads",
        "features": [
          "Self-service provisioning via console",
          "Support for multi-GPU configurations"
        ]
      }
    ]
  }
]
```

#### 5. GPU Services
Catalog of available GPUs and what they're best for:

```json
"gpuServices": [
  {
    "name": "GPU Catalog",
    "description": "Available GPU types and their use cases",
    "types": [
      {
        "name": "H100",
        "gpuModel": "NVIDIA H100 80 GB",
        "bestFor": "General training and latency-sensitive inference"
      },
      {
        "name": "L40S",
        "gpuModel": "NVIDIA L40S",
        "bestFor": "Cost-efficient inference, graphics, and video"
      }
    ]
  }
]
```

#### 6. Pricing Options (Models, NOT Amounts)
Describe the **types** of pricing available, not specific prices:

```json
"pricingOptions": [
  {
    "name": "On-Demand Instances",
    "description": "Pay for compute capacity by the second with no long-term commitments"
  },
  {
    "name": "Spot Instances",
    "description": "Use spare capacity at significant discounts compared to on-demand pricing"
  },
  {
    "name": "Reserved Instances",
    "description": "Save significantly with 1 or 3-year commitments"
  },
  {
    "name": "Commitment discounts",
    "description": "Save up to 35% versus on-demand with long-term commitments"
  }
]
```

**Note:** It's acceptable to mention percentage discounts (e.g., "up to 35% off", "save up to 72%") or relative comparisons (e.g., "significant savings", "up to 90% off on-demand price") as these describe the pricing model rather than absolute amounts.

#### 7. Additional Metadata

```json
"docsLink": "https://docs.provider.com",
"regions": "GPU clusters deployed across Europe and US with presence in 30+ regions",
"support": "Documentation available, self-service console, 24/7 enterprise support",
"tags": ["Budget"],
"uniqueSellingPoints": [
  "Vertically integrated AI cloud with transparent flagship GPU pricing",
  "Commitment discounts up to 35%"
]
```

---

## What NOT to Include ❌

### Specific Dollar Amounts

**Don't include:**
- Hourly rates: `"$2.30/hr"`, `"$0.89 per GPU hour"`
- Price ranges with amounts: `"$1.55–$1.82/hr"`, `"from $2.10/GPU-hr"`
- Instance pricing: `"$21.60 hr for 8-GPU configuration"`
- Promotional pricing: `"$2.49/hr (promo, then $4.49/hr)"`

**Why?** These change frequently and are handled by our scraping system.

### Time-Sensitive Information

Avoid information that will become outdated quickly:
- "Currently offering 20% discount"
- "New H100 GPUs launching next month"
- Dates in descriptions unless they're historical milestones

### Implementation Details in Pricing Options

**Bad example:**
```json
"pricingOptions": [
  {
    "name": "On-demand GPU pricing",
    "description": "H200 $2.30/hr, H100 $2.00/hr, L40S from $1.55–$1.82/hr"
  }
]
```

**Good example:**
```json
"pricingOptions": [
  {
    "name": "On-demand GPU pricing",
    "description": "Published hourly rates for H200, H100, and L40S GPUs with transparent pricing"
  }
]
```

---

## Complete Good Example

```json
{
  "id": "3bb5a379-472f-4c84-9ba4-3337f3922582",
  "name": "Amazon AWS",
  "slug": "aws",
  "description": "AWS provides a comprehensive suite of cloud computing services, including compute, storage, and GPU solutions for diverse workloads.",
  "link": "https://aws.amazon.com",
  "docsLink": "https://docs.aws.amazon.com",
  "features": [
    {
      "title": "Global Infrastructure",
      "description": "Extensive network of data centers across multiple regions worldwide"
    },
    {
      "title": "Pay-as-you-go Pricing",
      "description": "Flexible pricing model with no upfront commitments required"
    },
    {
      "title": "Advanced Security",
      "description": "Comprehensive security tools and compliance certifications"
    }
  ],
  "pros": [
    "Broad range of compute options including GPUs",
    "Highly scalable and reliable infrastructure",
    "Rich ecosystem of integrated services and tools"
  ],
  "cons": [
    "Complex pricing structure",
    "Steep learning curve for new users",
    "Potential for unexpected costs without proper management"
  ],
  "gettingStarted": [
    {
      "title": "Sign up for AWS",
      "description": "Create an AWS account to access the cloud platform"
    },
    {
      "title": "Choose a compute service",
      "description": "Select from EC2, Lambda, or container services based on your workload needs"
    }
  ],
  "gpuServices": [
    {
      "name": "EC2 GPU Instances",
      "description": "EC2 instances equipped with powerful GPUs for compute-intensive workloads",
      "types": [
        {
          "name": "P5 Instances",
          "gpuModel": "NVIDIA H100 Tensor Core",
          "bestFor": "Frontier-scale training; distributed HPC"
        },
        {
          "name": "P4 Instances",
          "gpuModel": "NVIDIA A100 Tensor Core",
          "bestFor": "Large-scale AI training, HPC simulations"
        }
      ]
    }
  ],
  "pricingOptions": [
    {
      "name": "On-Demand Instances",
      "description": "Pay for compute capacity by the second with no long-term commitments"
    },
    {
      "name": "Spot Instances",
      "description": "Use spare EC2 capacity at up to 90% off the On-Demand price"
    },
    {
      "name": "Reserved Instances",
      "description": "Save up to 72% compared to On-Demand pricing with a 1 or 3-year commitment"
    }
  ],
  "regions": "30+ regions and 100+ availability zones worldwide",
  "support": "Basic (free), Developer, Business, Enterprise support plans with varying response times",
  "hqCountry": "US",
  "tagline": "Comprehensive cloud platform with global reach",
  "tags": [],
  "category": "Classical hyperscaler"
}
```

---

## Summary Checklist

Before committing changes to a provider file, verify:

- [ ] No specific dollar amounts or hourly rates
- [ ] Pricing options describe models/types, not amounts
- [ ] Features, pros/cons are current and accurate
- [ ] GPU models listed match what's available
- [ ] Getting started steps are clear and helpful
- [ ] All required fields are present (id, name, slug, etc.)
- [ ] Information is relatively stable (won't need weekly updates)
- [ ] Content helps users understand provider differentiation

---

## Maintaining Provider Data

### When to Update Provider Files

Update provider JSON files when:
- Provider adds a new GPU model or service type
- Provider changes their pricing model structure (not specific amounts)
- Provider significantly changes their value proposition
- Provider updates their getting started process
- New features or capabilities are launched

### When NOT to Update

Don't update provider files for:
- Changes in hourly GPU prices (handled by scrapers)
- Temporary promotions or discounts
- Minor website updates
- Fluctuations in GPU availability

### Syncing to Database

After updating provider files:
```bash
# Dry run to preview changes
npm run providers:sync:dry

# Sync to database (with confirmation prompt)
npm run providers:sync
```

For more details, see the "Provider Data Management" section in `/CLAUDE.md`.
