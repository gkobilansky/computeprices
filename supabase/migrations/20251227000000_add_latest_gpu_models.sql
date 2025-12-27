-- Migration: Add latest GPU models (Blackwell, Hopper variants, AMD MI series, Intel Gaudi)
-- Date: 2025-12-27

-- === NVIDIA Blackwell Architecture (2024+) ===

-- GB200 Grace Blackwell Superchip
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  fp16_performance_tflops, fp32_performance_tflops, memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'GB200',
  'gb200',
  384,
  'NVIDIA',
  'Blackwell',
  'The NVIDIA GB200 Grace Blackwell Superchip connects two B200 GPUs to a Grace CPU via NVLink, offering massive memory capacity and bandwidth for trillion-parameter AI models and HPC workloads.',
  'Training trillion-parameter+ AI models, large-scale inference, HPC, scientific computing',
  true, true, 'ultra', '2024-03-18',
  9000.00, 160.00, 16000, 2700, 2700
) ON CONFLICT (slug) DO NOTHING;

-- B100
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  fp16_performance_tflops, fp32_performance_tflops, memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'B100',
  'b100',
  192,
  'NVIDIA',
  'Blackwell',
  'The NVIDIA B100 is a Blackwell architecture GPU designed for data center AI and HPC workloads, offering high performance with lower power consumption than B200.',
  'AI training and inference, HPC, data analytics',
  true, true, 'ultra', '2024-03-18',
  3500.00, 60.00, 8000, 700, 700
) ON CONFLICT (slug) DO NOTHING;

-- === NVIDIA Hopper Variants ===

-- H100 PCIe (40GB variant)
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, fp16_performance_tflops, fp32_performance_tflops, fp64_performance_tflops,
  memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'H100 PCIe',
  'h100pcie',
  80,
  'NVIDIA',
  'Hopper',
  'The H100 PCIe is a PCIe form factor variant of the H100, offering excellent AI and HPC performance in standard server configurations.',
  'AI training and inference, HPC, cloud computing',
  true, true, 'ultra', '2022-09-20',
  14592, 456, 756.00, 51.00, 26.00,
  2000, 350, 350
) ON CONFLICT (slug) DO NOTHING;

-- H100 NVL
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, fp16_performance_tflops, fp32_performance_tflops, fp64_performance_tflops,
  memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'H100 NVL',
  'h100nvl',
  94,
  'NVIDIA',
  'Hopper',
  'The H100 NVL is optimized for large language model inference, featuring dual-GPU design with 94GB combined memory and high NVLink bandwidth.',
  'LLM inference, generative AI, conversational AI',
  true, true, 'ultra', '2023-03-21',
  14592, 456, 835.00, 67.00, 34.00,
  3958, 400, 400
) ON CONFLICT (slug) DO NOTHING;

-- H100 SXM (if not exists as separate entry from H100)
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, fp16_performance_tflops, fp32_performance_tflops, fp64_performance_tflops,
  memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'H100 SXM',
  'h100sxm',
  80,
  'NVIDIA',
  'Hopper',
  'The H100 SXM is the flagship Hopper GPU with HBM3 memory and NVLink 4.0, designed for maximum AI training and HPC performance in data centers.',
  'Large-scale AI training, HPC, scientific simulation, LLM training',
  true, true, 'ultra', '2022-03-22',
  14592, 456, 990.00, 67.00, 34.00,
  3350, 700, 700
) ON CONFLICT (slug) DO NOTHING;

-- === AMD MI Series ===

-- MI300A (APU variant)
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  fp16_performance_tflops, memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'MI300A',
  'mi300a',
  128,
  'AMD',
  'CDNA 3',
  'The AMD Instinct MI300A is an APU combining CPU and GPU on a single package, designed for HPC workloads requiring unified memory.',
  'HPC, scientific computing, AI training',
  true, true, 'ultra', '2023-12-06',
  980.00, 5300, 760, 760
) ON CONFLICT (slug) DO NOTHING;

-- MI355X (announced)
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  fp16_performance_tflops, memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'MI355X',
  'mi355x',
  288,
  'AMD',
  'CDNA 4',
  'The AMD Instinct MI355X is the next-generation CDNA 4 accelerator with 288GB HBM3E memory, targeting AI training and large-scale inference.',
  'AI training, LLM inference, HPC',
  true, true, 'ultra', '2025-06-01',
  1800.00, 8000, 1000, 1000
) ON CONFLICT (slug) DO NOTHING;

-- MI250X
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  fp16_performance_tflops, fp64_performance_tflops, memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'MI250X',
  'mi250x',
  128,
  'AMD',
  'CDNA 2',
  'The AMD Instinct MI250X is a dual-GCD accelerator with 128GB HBM2e memory, designed for HPC and AI workloads in exascale systems.',
  'HPC, AI training, scientific computing',
  true, true, 'ultra', '2021-11-08',
  383.00, 47.87, 3276, 560, 560
) ON CONFLICT (slug) DO NOTHING;

-- MI250
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  fp16_performance_tflops, fp64_performance_tflops, memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'MI250',
  'mi250',
  128,
  'AMD',
  'CDNA 2',
  'The AMD Instinct MI250 is a data center GPU accelerator with 128GB HBM2e memory for AI and HPC workloads.',
  'AI training, HPC, data analytics',
  true, true, 'ultra', '2021-11-08',
  362.00, 45.26, 3276, 500, 500
) ON CONFLICT (slug) DO NOTHING;

-- MI210
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  fp16_performance_tflops, fp64_performance_tflops, memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'MI210',
  'mi210',
  64,
  'AMD',
  'CDNA 2',
  'The AMD Instinct MI210 is a single-GCD accelerator offering a balance of performance and power efficiency for data center AI and HPC.',
  'AI inference, HPC, cloud computing',
  true, true, 'high', '2022-03-22',
  181.00, 22.63, 1638, 300, 300
) ON CONFLICT (slug) DO NOTHING;

-- MI100
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  fp16_performance_tflops, fp64_performance_tflops, memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'MI100',
  'mi100',
  32,
  'AMD',
  'CDNA',
  'The AMD Instinct MI100 was the first CDNA architecture accelerator, designed for HPC and AI workloads.',
  'HPC, AI training, scientific computing',
  true, true, 'high', '2020-11-16',
  184.60, 11.54, 1228, 300, 300
) ON CONFLICT (slug) DO NOTHING;

-- === Intel Data Center GPUs ===

-- Gaudi 3
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  fp16_performance_tflops, memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'Gaudi 3',
  'gaudi3',
  128,
  'Intel',
  'Gaudi',
  'Intel Gaudi 3 is a purpose-built AI accelerator offering competitive performance for training and inference of large language models.',
  'AI training, LLM inference, generative AI',
  true, true, 'ultra', '2024-04-09',
  1835.00, 3675, 900, 900
) ON CONFLICT (slug) DO NOTHING;

-- Gaudi 2
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  fp16_performance_tflops, memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'Gaudi 2',
  'gaudi2',
  96,
  'Intel',
  'Gaudi',
  'Intel Gaudi 2 is an AI training and inference accelerator designed for efficient deep learning workloads.',
  'AI training, inference, deep learning',
  true, true, 'high', '2022-05-10',
  432.00, 2450, 600, 600
) ON CONFLICT (slug) DO NOTHING;

-- Max 1550
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  fp16_performance_tflops, fp64_performance_tflops, memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'Max 1550',
  'max1550',
  128,
  'Intel',
  'Xe HPC',
  'The Intel Data Center GPU Max 1550 is designed for HPC and AI workloads with high memory bandwidth and FP64 performance.',
  'HPC, scientific computing, AI training',
  true, true, 'ultra', '2022-11-09',
  839.00, 52.00, 3276, 600, 600
) ON CONFLICT (slug) DO NOTHING;

-- Max 1100
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  fp16_performance_tflops, fp64_performance_tflops, memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'Max 1100',
  'max1100',
  48,
  'Intel',
  'Xe HPC',
  'The Intel Data Center GPU Max 1100 is a PCIe form factor GPU for HPC and AI acceleration.',
  'HPC, AI inference, scientific computing',
  true, true, 'high', '2022-11-09',
  419.00, 26.00, 1229, 300, 300
) ON CONFLICT (slug) DO NOTHING;

-- === NVIDIA Ampere Data Center ===

-- A30
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, fp16_performance_tflops, fp32_performance_tflops, fp64_performance_tflops,
  memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'A30',
  'a30',
  24,
  'NVIDIA',
  'Ampere',
  'The NVIDIA A30 is a versatile data center GPU for mainstream AI inference, training, and HPC workloads with Multi-Instance GPU support.',
  'AI inference, training, HPC, MIG workloads',
  true, true, 'high', '2021-04-12',
  3584, 224, 165.00, 10.30, 5.20,
  933, 165, 165
) ON CONFLICT (slug) DO NOTHING;

-- A16
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, fp16_performance_tflops, fp32_performance_tflops,
  memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'A16',
  'a16',
  64,
  'NVIDIA',
  'Ampere',
  'The NVIDIA A16 is a multi-GPU card with 4 GPUs designed for graphics-intensive virtual desktop infrastructure (VDI) and cloud gaming.',
  'VDI, cloud gaming, graphics streaming',
  true, true, 'mid', '2021-04-12',
  2560, 35.00, 17.50,
  800, 250, 250
) ON CONFLICT (slug) DO NOTHING;

-- A2
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, fp16_performance_tflops, fp32_performance_tflops,
  memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'A2',
  'a2',
  16,
  'NVIDIA',
  'Ampere',
  'The NVIDIA A2 is an entry-level data center GPU for efficient AI inference at the edge and in compact servers.',
  'AI inference, edge computing, smart video analytics',
  true, true, 'entry', '2021-11-09',
  1280, 40, 36.00, 4.50,
  200, 60, 60
) ON CONFLICT (slug) DO NOTHING;

-- === NVIDIA GeForce RTX 40-series ===

-- RTX 4070 Ti SUPER
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, rt_cores, fp32_performance_tflops,
  memory_bandwidth_gbps, memory_interface_bit, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'RTX 4070 Ti SUPER',
  'rtx4070tisuper',
  16,
  'NVIDIA',
  'Ada Lovelace',
  'The RTX 4070 Ti SUPER offers excellent 1440p and 4K gaming with DLSS 3 and ray tracing capabilities.',
  'Gaming, content creation, AI development',
  false, true, 'high', '2024-01-24',
  8448, 264, 66, 44.10,
  672, 256, 285, 285
) ON CONFLICT (slug) DO NOTHING;

-- RTX 4070 Ti
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, rt_cores, fp32_performance_tflops,
  memory_bandwidth_gbps, memory_interface_bit, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'RTX 4070 Ti',
  'rtx4070ti',
  12,
  'NVIDIA',
  'Ada Lovelace',
  'The RTX 4070 Ti delivers high-performance 1440p gaming with Ada Lovelace architecture and DLSS 3.',
  'Gaming, content creation, AI development',
  false, true, 'high', '2023-01-05',
  7680, 240, 60, 40.09,
  504, 192, 285, 285
) ON CONFLICT (slug) DO NOTHING;

-- RTX 4070 SUPER
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, rt_cores, fp32_performance_tflops,
  memory_bandwidth_gbps, memory_interface_bit, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'RTX 4070 SUPER',
  'rtx4070super',
  12,
  'NVIDIA',
  'Ada Lovelace',
  'The RTX 4070 SUPER offers improved performance over the base 4070 for 1440p gaming and content creation.',
  'Gaming, content creation, AI inference',
  false, true, 'mid', '2024-01-17',
  7168, 224, 56, 35.48,
  504, 192, 220, 220
) ON CONFLICT (slug) DO NOTHING;

-- RTX 4070
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, rt_cores, fp32_performance_tflops,
  memory_bandwidth_gbps, memory_interface_bit, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'RTX 4070',
  'rtx4070',
  12,
  'NVIDIA',
  'Ada Lovelace',
  'The RTX 4070 provides excellent 1080p and 1440p gaming performance with DLSS 3 support.',
  'Gaming, content creation, AI development',
  false, true, 'mid', '2023-04-13',
  5888, 184, 46, 29.15,
  504, 192, 200, 200
) ON CONFLICT (slug) DO NOTHING;

-- RTX 4060 Ti
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, rt_cores, fp32_performance_tflops,
  memory_bandwidth_gbps, memory_interface_bit, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'RTX 4060 Ti',
  'rtx4060ti',
  8,
  'NVIDIA',
  'Ada Lovelace',
  'The RTX 4060 Ti offers solid 1080p gaming performance with efficiency improvements from Ada Lovelace.',
  'Gaming, content creation',
  false, true, 'mid', '2023-05-24',
  4352, 136, 34, 22.06,
  288, 128, 160, 160
) ON CONFLICT (slug) DO NOTHING;

-- RTX 4060
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, rt_cores, fp32_performance_tflops,
  memory_bandwidth_gbps, memory_interface_bit, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'RTX 4060',
  'rtx4060',
  8,
  'NVIDIA',
  'Ada Lovelace',
  'The RTX 4060 provides efficient 1080p gaming with DLSS 3 and ray tracing in a power-efficient package.',
  'Gaming, general computing',
  false, true, 'entry', '2023-06-29',
  3072, 96, 24, 15.11,
  272, 128, 115, 115
) ON CONFLICT (slug) DO NOTHING;

-- RTX 4080 SUPER
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, rt_cores, fp32_performance_tflops,
  memory_bandwidth_gbps, memory_interface_bit, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'RTX 4080 SUPER',
  'rtx4080super',
  16,
  'NVIDIA',
  'Ada Lovelace',
  'The RTX 4080 SUPER delivers near-flagship performance for 4K gaming and content creation.',
  'Gaming, content creation, AI development',
  false, true, 'high', '2024-01-31',
  10240, 320, 80, 52.22,
  736, 256, 320, 320
) ON CONFLICT (slug) DO NOTHING;

-- === NVIDIA GeForce RTX 30-series ===

-- RTX 3090 Ti
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, rt_cores, fp32_performance_tflops,
  memory_bandwidth_gbps, memory_interface_bit, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'RTX 3090 Ti',
  'rtx3090ti',
  24,
  'NVIDIA',
  'Ampere',
  'The RTX 3090 Ti was the flagship Ampere gaming GPU with 24GB GDDR6X for extreme 4K gaming and content creation.',
  'Gaming, content creation, AI prototyping',
  false, true, 'high', '2022-03-29',
  10752, 336, 84, 40.00,
  1008, 384, 450, 450
) ON CONFLICT (slug) DO NOTHING;

-- RTX 3080 Ti
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, rt_cores, fp32_performance_tflops,
  memory_bandwidth_gbps, memory_interface_bit, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'RTX 3080 Ti',
  'rtx3080ti',
  12,
  'NVIDIA',
  'Ampere',
  'The RTX 3080 Ti offers near-3090 performance for 4K gaming with 12GB GDDR6X memory.',
  'Gaming, content creation, AI development',
  false, true, 'high', '2021-06-03',
  10240, 320, 80, 34.10,
  912, 384, 350, 350
) ON CONFLICT (slug) DO NOTHING;

-- RTX 3080
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, rt_cores, fp32_performance_tflops,
  memory_bandwidth_gbps, memory_interface_bit, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'RTX 3080',
  'rtx3080',
  10,
  'NVIDIA',
  'Ampere',
  'The RTX 3080 delivers excellent 4K gaming performance with Ampere architecture and DLSS support.',
  'Gaming, content creation',
  false, true, 'mid', '2020-09-17',
  8704, 272, 68, 29.77,
  760, 320, 320, 320
) ON CONFLICT (slug) DO NOTHING;

-- RTX 3070 Ti
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, rt_cores, fp32_performance_tflops,
  memory_bandwidth_gbps, memory_interface_bit, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'RTX 3070 Ti',
  'rtx3070ti',
  8,
  'NVIDIA',
  'Ampere',
  'The RTX 3070 Ti provides excellent 1440p gaming with improved performance over the base 3070.',
  'Gaming, content creation',
  false, true, 'mid', '2021-06-10',
  6144, 192, 48, 21.75,
  608, 256, 290, 290
) ON CONFLICT (slug) DO NOTHING;

-- RTX 3070
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, rt_cores, fp32_performance_tflops,
  memory_bandwidth_gbps, memory_interface_bit, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'RTX 3070',
  'rtx3070',
  8,
  'NVIDIA',
  'Ampere',
  'The RTX 3070 offers RTX 2080 Ti-level performance for 1440p gaming at a lower price point.',
  'Gaming, content creation',
  false, true, 'mid', '2020-10-29',
  5888, 184, 46, 20.31,
  448, 256, 220, 220
) ON CONFLICT (slug) DO NOTHING;

-- === NVIDIA Professional Ada Lovelace ===

-- RTX 5000 Ada
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, rt_cores, fp32_performance_tflops,
  memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'RTX 5000 Ada',
  'rtx5000ada',
  32,
  'NVIDIA',
  'Ada Lovelace',
  'The RTX 5000 Ada is a professional workstation GPU with 32GB memory for demanding visualization and AI workloads.',
  'Professional visualization, AI development, rendering',
  false, true, 'high', '2023-08-08',
  12800, 400, 100, 65.28,
  576, 250, 250
) ON CONFLICT (slug) DO NOTHING;

-- RTX 4500 Ada
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, rt_cores, fp32_performance_tflops,
  memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'RTX 4500 Ada',
  'rtx4500ada',
  24,
  'NVIDIA',
  'Ada Lovelace',
  'The RTX 4500 Ada is a mid-range professional GPU for CAD, rendering, and AI workflows.',
  'Professional visualization, CAD, AI development',
  false, true, 'mid', '2023-08-08',
  7680, 240, 60, 39.63,
  432, 210, 210
) ON CONFLICT (slug) DO NOTHING;

-- RTX 4000 Ada
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, rt_cores, fp32_performance_tflops,
  memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'RTX 4000 Ada',
  'rtx4000ada',
  20,
  'NVIDIA',
  'Ada Lovelace',
  'The RTX 4000 Ada is an entry-level professional GPU for everyday CAD and visualization tasks.',
  'Professional visualization, CAD',
  false, true, 'mid', '2023-08-08',
  6144, 192, 48, 26.73,
  360, 130, 130
) ON CONFLICT (slug) DO NOTHING;

-- L4
INSERT INTO public.gpu_models (
  id, name, slug, vram, manufacturer, architecture, description, use_cases,
  server_gpu, cloud_compatible, performance_tier, release_date,
  cuda_cores, tensor_cores, fp16_performance_tflops, fp32_performance_tflops,
  memory_bandwidth_gbps, tdp_watt, max_power_watt
) VALUES (
  gen_random_uuid(),
  'L4',
  'l4',
  24,
  'NVIDIA',
  'Ada Lovelace',
  'The NVIDIA L4 is a versatile data center GPU optimized for AI inference, video processing, and graphics workloads.',
  'AI inference, video processing, cloud graphics',
  true, true, 'entry', '2023-03-21',
  7424, 232, 121.00, 30.29,
  300, 72, 72
) ON CONFLICT (slug) DO NOTHING;
