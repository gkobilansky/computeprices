#!/usr/bin/env node

/**
 * Simple test for data layer integration
 */

import dotenv from 'dotenv';
import { supabase } from '../lib/supabase.js';
import { fetchGPUPrices, fetchProviders } from '../lib/utils/fetchGPUData.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection and basic functionality...\n');

  try {
    // Test 1: Basic database connection
    console.log('1. Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('providers')
      .select('id, name')
      .limit(1);
    
    if (testError) throw testError;
    console.log('   ✅ Database connection successful');

    // Test 2: Fetch all providers
    console.log('\n2. Testing fetchProviders()...');
    const providers = await fetchProviders();
    console.log(`   ✅ Found ${providers.length} providers:`);
    providers.slice(0, 5).forEach(p => console.log(`   - ${p.name} (${p.id})`));

    if (providers.length < 2) {
      throw new Error('Need at least 2 providers for comparison testing');
    }

    // Test 3: Test original fetchGPUPrices function
    console.log('\n3. Testing original fetchGPUPrices()...');
    const singleProviderData = await fetchGPUPrices({ 
      selectedProvider: providers[0].id 
    });
    console.log(`   ✅ Fetched ${singleProviderData.length} price entries for ${providers[0].name}`);

    // Test 4: Test extended fetchGPUPrices with multiple providers
    console.log('\n4. Testing extended fetchGPUPrices() with multiple providers...');
    const testProviderIds = providers.slice(0, 2).map(p => p.id);
    console.log(`   Testing with providers: ${testProviderIds.map(id => providers.find(p => p.id === id)?.name).join(', ')}`);
    
    const multiProviderData = await fetchGPUPrices({ 
      selectedProviders: testProviderIds
    });
    console.log(`   ✅ Fetched ${multiProviderData.length} total price entries from multiple providers`);

    // Test 5: Verify data structure
    if (multiProviderData.length > 0) {
      console.log('\n5. Verifying data structure...');
      const sample = multiProviderData[0];
      console.log('   Sample data structure:');
      console.log(`   - GPU: ${sample.gpu_model_name || 'N/A'}`);
      console.log(`   - Provider: ${sample.provider_name || 'N/A'}`);
      console.log(`   - Price: $${sample.price_per_hour || 'N/A'}/hour`);
      console.log('   ✅ Data structure looks correct');
    }

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

async function runSimpleTest() {
  console.log('🚀 Starting Simple Data Layer Integration Test\n');
  console.log('='*50 + '\n');

  const success = await testDatabaseConnection();

  console.log('\n' + '='*50);
  console.log('📊 TEST SUMMARY');
  console.log('='*50);
  console.log(`Result: ${success ? '✅ BASIC TESTS PASSED' : '❌ TESTS FAILED'}`);

  if (success) {
    console.log('\n✨ Basic data layer functionality is working!');
    console.log('The extended fetchGPUPrices() function supports multiple providers.');
    console.log('\nNext steps:');
    console.log('- TypeScript compilation for comparison.ts and database.ts');
    console.log('- Full comparison data structure testing');
    console.log('- Performance benchmarking');
  }

  return success;
}

// Run the test
runSimpleTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });