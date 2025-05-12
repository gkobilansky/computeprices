-- Sample enhanced data for H100 GPU to showcase the redesigned GPU detail page
-- This is a demonstration script with realistic values

-- First, update the H100 GPU with enhanced information
UPDATE gpu_models
SET 
  -- Basic fields
  image_url = '/images/gpus/h100.jpg',
  description = 'NVIDIA H100 Tensor Core GPU, the most advanced accelerator for AI and HPC workloads',
  detailed_description = 'The NVIDIA H100 Tensor Core GPU is built on the groundbreaking NVIDIA Hopper architecture to deliver the next massive leap in accelerated computing. H100 is designed to handle the most compute-intensive workloads, including foundation models, large language models, recommender systems, and scientific simulations. It features fourth-generation Tensor Cores and Transformer Engine for unprecedented AI performance, and introduces new features like Dynamic Programming Accelerator for dynamic programming algorithms.',
  
  -- Technical specifications
  compute_units = 132,
  cuda_cores = 18432,
  tensor_cores = 576,
  rt_cores = 0,
  memory_bandwidth_gbps = 3350,
  memory_interface_bit = 5120,
  manufacturing_process_nm = 4,
  tdp_watt = 700,
  max_power_watt = 800,
  release_date = '2022-03-22',
  
  -- Performance specs
  fp16_performance_tflops = 1000.00,
  fp32_performance_tflops = 67.00,
  fp64_performance_tflops = 33.50,
  int8_performance_tops = 2000.00,
  ml_perf_inference_score = 940.00,
  ml_perf_training_score = 845.50,
  
  -- Market data
  msrp_usd = 30000,
  server_gpu = TRUE,
  cloud_compatible = TRUE,
  performance_tier = 'ultra',
  generation = 9,
  
  -- Content fields
  pros = ARRAY[
    'Groundbreaking performance for AI workloads',
    'Next-generation Tensor Cores with significant performance uplift',
    'Transformer Engine for accelerating language models',
    'New architectural features for advanced computing tasks',
    'Support for HBM3 memory with massive bandwidth'
  ],
  cons = ARRAY[
    'Very high power consumption',
    'Premium pricing',
    'Requires specialized cooling and power infrastructure',
    'Not suitable for most consumer or small business applications'
  ],
  features = ARRAY[
    'Fourth-generation Tensor Cores',
    'Transformer Engine',
    'Dynamic Programming Accelerator',
    'HBM3 Memory',
    'NVLink 4.0',
    'PCIe Gen 5',
    'Confidential Computing',
    'Multi-Instance GPU (MIG) with up to 7 instances'
  ],
  
  -- Links
  benchmark_links = '{
    "MLPerf Inference Results": "https://mlcommons.org/en/inference-datacenter-55/",
    "MLPerf Training Results": "https://mlcommons.org/en/training-normal-20/"
  }'::jsonb,
  affiliate_links = '{
    "NVIDIA": "https://www.nvidia.com/en-us/data-center/h100/",
    "AWS": "https://aws.amazon.com/ec2/instance-types/p5/",
    "Google Cloud": "https://cloud.google.com/compute/docs/gpus"
  }'::jsonb,
  
  -- Update existing fields with better content
  use_cases = 'The H100 GPU is designed for the most demanding AI and HPC workloads, including training and inference for large language models (LLMs), foundation models, generative AI, healthcare research, scientific simulation, and financial modeling. It excels at large-scale machine learning tasks, natural language processing, computer vision, and computational chemistry.'
  
WHERE name = 'H100';

-- If no H100 exists in the database, insert it
INSERT INTO gpu_models (
  id, name, slug, manufacturer, architecture, vram, 
  image_url, description, detailed_description, 
  compute_units, cuda_cores, tensor_cores, rt_cores,
  memory_bandwidth_gbps, memory_interface_bit, manufacturing_process_nm,
  tdp_watt, max_power_watt, release_date,
  fp16_performance_tflops, fp32_performance_tflops, fp64_performance_tflops,
  int8_performance_tops, ml_perf_inference_score, ml_perf_training_score,
  msrp_usd, server_gpu, cloud_compatible, performance_tier, generation,
  pros, cons, features, benchmark_links, affiliate_links, use_cases
)
SELECT 
  gen_random_uuid(), 'H100', 'h100', 'NVIDIA', 'Hopper', 80,
  '/images/gpus/h100.jpg',
  'NVIDIA H100 Tensor Core GPU, the most advanced accelerator for AI and HPC workloads',
  'The NVIDIA H100 Tensor Core GPU is built on the groundbreaking NVIDIA Hopper architecture to deliver the next massive leap in accelerated computing. H100 is designed to handle the most compute-intensive workloads, including foundation models, large language models, recommender systems, and scientific simulations. It features fourth-generation Tensor Cores and Transformer Engine for unprecedented AI performance, and introduces new features like Dynamic Programming Accelerator for dynamic programming algorithms.',
  132, 18432, 576, 0,
  3350, 5120, 4,
  700, 800, '2022-03-22',
  1000.00, 67.00, 33.50,
  2000.00, 940.00, 845.50,
  30000, TRUE, TRUE, 'ultra', 9,
  ARRAY[
    'Groundbreaking performance for AI workloads',
    'Next-generation Tensor Cores with significant performance uplift',
    'Transformer Engine for accelerating language models',
    'New architectural features for advanced computing tasks',
    'Support for HBM3 memory with massive bandwidth'
  ],
  ARRAY[
    'Very high power consumption',
    'Premium pricing',
    'Requires specialized cooling and power infrastructure',
    'Not suitable for most consumer or small business applications'
  ],
  ARRAY[
    'Fourth-generation Tensor Cores',
    'Transformer Engine',
    'Dynamic Programming Accelerator',
    'HBM3 Memory',
    'NVLink 4.0',
    'PCIe Gen 5',
    'Confidential Computing',
    'Multi-Instance GPU (MIG) with up to 7 instances'
  ],
  '{
    "MLPerf Inference Results": "https://mlcommons.org/en/inference-datacenter-55/",
    "MLPerf Training Results": "https://mlcommons.org/en/training-normal-20/"
  }'::jsonb,
  '{
    "NVIDIA": "https://www.nvidia.com/en-us/data-center/h100/",
    "AWS": "https://aws.amazon.com/ec2/instance-types/p5/",
    "Google Cloud": "https://cloud.google.com/compute/docs/gpus"
  }'::jsonb,
  'The H100 GPU is designed for the most demanding AI and HPC workloads, including training and inference for large language models (LLMs), foundation models, generative AI, healthcare research, scientific simulation, and financial modeling. It excels at large-scale machine learning tasks, natural language processing, computer vision, and computational chemistry.'
WHERE NOT EXISTS (
  SELECT 1 FROM gpu_models WHERE name = 'H100'
); 