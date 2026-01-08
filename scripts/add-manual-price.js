import readline from 'readline';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { runSafetyChecks, logDatabaseTarget } from '../lib/db-safety.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query, defaultValue = undefined) {
    return new Promise(resolve => {
        const prompt = defaultValue ? `${query} (default: ${defaultValue}): ` : `${query}: `;
        rl.question(prompt, answer => {
            resolve(answer.trim() || defaultValue || '');
        });
    });
}

async function addManualPrice() {
    // Run safety checks before any database operations
    try {
        await runSafetyChecks({
            operation: 'Manual Price Entry',
            requiredEnvVars: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
            allowProduction: true,
            args: process.argv
        });
    } catch (error) {
        console.error(error.message);
        rl.close();
        process.exit(1);
    }

    console.log('ℹ️ Please provide the following details to add new price records.');

    const provider_id = await askQuestion('Enter Provider ID');
    if (!provider_id || provider_id.length < 5) { // Basic check
        console.error('❌ Error: Provider ID is required and seems invalid.');
        rl.close();
        process.exit(1);
    }

    let providerNameDefault = 'Manual Entry';
    let providerUrlDefault = 'manual';
    let fetchedProviderName = ''; // Store the actual provider name for prompts

    try {
        const { data: providerData, error: providerError } = await supabaseAdmin
            .from('providers')
            .select('name, website, pricing_page')
            .eq('id', provider_id)
            .single();

        if (providerError) {
            console.warn(`⚠️ Warning: Could not fetch provider details for default values: ${providerError.message}`);
        } else if (providerData) {
            fetchedProviderName = providerData.name || '';
            providerNameDefault = providerData.name || providerNameDefault;
            providerUrlDefault = providerData.pricing_page || providerData.website || providerUrlDefault;
        }
    } catch (e) {
        console.warn(`⚠️ Warning: Error fetching provider details: ${e.message}`);
    }

    // Fetch and display GPU models
    try {
        const { data: gpuModels, error: gpuModelsError } = await supabaseAdmin
            .from('gpu_models')
            .select('id, name')
            .order('name', { ascending: true });

        if (gpuModelsError) {
            console.warn(`\n⚠️ Warning: Could not fetch GPU models list: ${gpuModelsError.message}`);
        } else if (gpuModels && gpuModels.length > 0) {
            console.log('\n📜 Available GPU Models and IDs (Name - ID):');

            const formattedModels = gpuModels.map(model => `${model.name} (${model.id})`);

            let maxLength = 0;
            formattedModels.forEach(fm => {
                if (fm.length > maxLength) {
                    maxLength = fm.length;
                }
            });
            maxLength += 2; // Add padding

            let output = '';
            for (let i = 0; i < formattedModels.length; i += 3) {
                const col1 = formattedModels[i]?.padEnd(maxLength, ' ') || ''.padEnd(maxLength, ' ');
                const col2 = formattedModels[i + 1]?.padEnd(maxLength, ' ') || ''.padEnd(maxLength, ' ');
                const col3 = formattedModels[i + 2]?.padEnd(maxLength, ' ') || ''.padEnd(maxLength, ' ');
                output += `${col1}| ${col2}| ${col3}\n`;
            }
            console.log(output);

        } else {
            console.log('\nℹ️ No GPU models found in the database.');
        }
    } catch (e) {
        console.warn(`\n⚠️ Warning: Error fetching GPU models list: ${e.message}`);
    }

    let addAnotherGpu = true;

    while (addAnotherGpu) {
        console.log(`\n--- Adding GPU Price for Provider: ${fetchedProviderName || provider_id} ---`);

        let gpu_model_id;
        while (true) {
            gpu_model_id = await askQuestion('Enter GPU Model ID');
            if (gpu_model_id && gpu_model_id.length >= 5) { // Basic check
                break;
            }
            console.error('❌ Error: GPU Model ID is required and seems invalid (must be at least 5 characters).');
        }

        let price_per_hour_str;
        let price_per_hour;
        while (true) {
            price_per_hour_str = await askQuestion('Enter Price per Hour');
            price_per_hour = parseFloat(price_per_hour_str);
            if (!isNaN(price_per_hour)) {
                break;
            }
            console.error(`❌ Error: Invalid Price per Hour value: "${price_per_hour_str}". Must be a number.`);
        }

        const source_name = await askQuestion('Enter Source Name', providerNameDefault);
        const source_url = await askQuestion('Enter Source URL', providerUrlDefault);

        console.log('\n➕ Attempting to add new price record with the following details:');
        console.log(`   Provider ID: ${provider_id}`);
        console.log(`   GPU Model ID: ${gpu_model_id}`);
        console.log(`   Price per Hour: ${price_per_hour}`);
        console.log(`   Source Name: ${source_name}`);
        console.log(`   Source URL: ${source_url}`);

        try {
            const { data, error } = await supabaseAdmin
                .from('prices')
                .insert([
                    {
                        provider_id,
                        gpu_model_id,
                        price_per_hour,
                        source_name,
                        source_url,
                    },
                ])
                .select();

            if (error) {
                console.error('\n❌ Error inserting price record:', error.message);
                if (error.details) console.error('   Details:', error.details);
                if (error.hint) console.error('   Hint:', error.hint);
                // Do not exit process, allow user to try adding another GPU or quit
            } else if (data && data.length > 0) {
                console.log('\n✅ Successfully added new price record:');
                console.table(data);
            } else {
                console.log('\n⚠️ Price record might have been inserted, but no data was returned. Please verify in the database.');
            }

        } catch (err) {
            console.error('\n❌ An unexpected error occurred during insertion:', err.message);
            // Do not exit process, allow user to try adding another GPU or quit
        }

        const continueAnswer = await askQuestion(`Add another GPU price for ${fetchedProviderName || 'this provider'}? (y/n)`, 'y');
        addAnotherGpu = continueAnswer.toLowerCase() === 'y';
    }

    rl.close();
    console.log('\n✨ Process completed.');
}

addManualPrice(); 