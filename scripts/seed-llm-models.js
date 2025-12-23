import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const llmModels = [
  // OpenAI
  { name: 'GPT-4o', slug: 'gpt-4o', creator: 'OpenAI', context_window: 128000 },
  { name: 'GPT-4o mini', slug: 'gpt-4o-mini', creator: 'OpenAI', context_window: 128000 },
  { name: 'GPT-4.1', slug: 'gpt-4-1', creator: 'OpenAI', context_window: 1000000 },
  { name: 'GPT-4.1 mini', slug: 'gpt-4-1-mini', creator: 'OpenAI', context_window: 1000000 },
  { name: 'o1', slug: 'o1', creator: 'OpenAI', context_window: 200000 },
  { name: 'o1-mini', slug: 'o1-mini', creator: 'OpenAI', context_window: 128000 },
  { name: 'o3-mini', slug: 'o3-mini', creator: 'OpenAI', context_window: 200000 },

  // Anthropic
  { name: 'Claude 3.5 Sonnet', slug: 'claude-3-5-sonnet', creator: 'Anthropic', context_window: 200000 },
  { name: 'Claude 3.5 Haiku', slug: 'claude-3-5-haiku', creator: 'Anthropic', context_window: 200000 },
  { name: 'Claude 3 Opus', slug: 'claude-3-opus', creator: 'Anthropic', context_window: 200000 },

  // Meta (offered by Together, Fireworks, DeepInfra)
  { name: 'Llama 3.3 70B', slug: 'llama-3-3-70b', creator: 'Meta', context_window: 128000 },
  { name: 'Llama 3.1 405B', slug: 'llama-3-1-405b', creator: 'Meta', context_window: 128000 },
  { name: 'Llama 3.1 70B', slug: 'llama-3-1-70b', creator: 'Meta', context_window: 128000 },
  { name: 'Llama 3.1 8B', slug: 'llama-3-1-8b', creator: 'Meta', context_window: 128000 },

  // DeepSeek (offered by multiple providers)
  { name: 'DeepSeek V3', slug: 'deepseek-v3', creator: 'DeepSeek', context_window: 64000 },
  { name: 'DeepSeek R1', slug: 'deepseek-r1', creator: 'DeepSeek', context_window: 64000 },

  // Mistral (offered by multiple providers)
  { name: 'Mistral Large', slug: 'mistral-large', creator: 'Mistral', context_window: 128000 },
  { name: 'Mixtral 8x7B', slug: 'mixtral-8x7b', creator: 'Mistral', context_window: 32000 },
  { name: 'Mistral Small', slug: 'mistral-small', creator: 'Mistral', context_window: 32000 },

  // Google (offered by some providers)
  { name: 'Gemma 2 27B', slug: 'gemma-2-27b', creator: 'Google', context_window: 8192 },
  { name: 'Gemma 2 9B', slug: 'gemma-2-9b', creator: 'Google', context_window: 8192 },

  // Qwen
  { name: 'Qwen 2.5 72B', slug: 'qwen-2-5-72b', creator: 'Alibaba', context_window: 128000 },
  { name: 'Qwen 2.5 Coder 32B', slug: 'qwen-2-5-coder-32b', creator: 'Alibaba', context_window: 128000 },
];

async function seedModels() {
  console.log('Seeding LLM models...');

  for (const model of llmModels) {
    const { data, error } = await supabase
      .from('llm_models')
      .upsert(model, { onConflict: 'slug' });

    if (error) {
      console.error(`Error inserting ${model.name}:`, error.message);
    } else {
      console.log(`Inserted/updated: ${model.name}`);
    }
  }

  console.log('Done seeding LLM models');
}

seedModels();
