#!/usr/bin/env node

/**
 * Script to download free-to-use GPU images for the website
 * This script fetches images from manufacturer websites or Wikimedia Commons
 * where they are available for use under appropriate licenses.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { supabase } = require('../../lib/supabase-admin');

// Directory to save images
const IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'gpus');

// Ensure the directory exists
if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

// Map of GPU model patterns to image URLs
// These are publicly available images that can be used with attribution
const GPU_IMAGE_SOURCES = {
    'H100': 'https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/h100/h100-nvl-fullheight-200px-td-d.png',
    'A100': 'https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a100/nvidia-a100-pcie-40gb-800x450.jpg',
    'A10G': 'https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/nvidia-a10/nvidia-a10-og-1200x630.jpg',
    'A10': 'https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/nvidia-a10/nvidia-a10-og-1200x630.jpg',
    'L4': 'https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/l4/l4-gpu-100px@2x.jpg',
    'T4': 'https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/tesla-t4/t4-100-200px-t.jpg',
    'V100': 'https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/tesla-v100/tesla-v100-pcie-photo-704-t.jpg',
    'RTX 6000': 'https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/rtx6000/nvidia-rtx-6000-ada-t.jpg',
    'RTX 4090': 'https://www.nvidia.com/content/dam/en-zz/Solutions/geforce/ada/rtx-4090/geforce-ada-4090-product-photo-003-t.jpg',
    'RTX 3090': 'https://www.nvidia.com/content/dam/en-zz/Solutions/geforce/ampere/rtx-3090/geforce-rtx-3090-shop-600-p@2x.png',
    'RTX A6000': 'https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/quadro-product-page/quadro-a6000/nvidia-rtx-a6000-100px-front-t.jpg',
};

// Function to download an image
function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            // Check if the response is successful
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${response.statusCode}`));
                return;
            }

            // Create a write stream to save the image
            const fileStream = fs.createWriteStream(path.join(IMAGE_DIR, filename));
            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`✅ Downloaded ${filename}`);
                resolve(filename);
            });

            fileStream.on('error', (err) => {
                fs.unlink(path.join(IMAGE_DIR, filename), () => { });
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Function to find the best match for a GPU model
function findBestMatch(modelName) {
    for (const [pattern, url] of Object.entries(GPU_IMAGE_SOURCES)) {
        if (modelName.includes(pattern)) {
            return { pattern, url };
        }
    }
    return null;
}

// Main function
async function main() {
    console.log('🔍 Fetching GPU models from database...');

    try {
        // Fetch all GPU models
        const { data: gpuModels, error } = await supabase
            .from('gpu_models')
            .select('*');

        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }

        console.log(`Found ${gpuModels.length} GPU models`);

        // Keep track of processed models
        const processedImages = new Set();
        const updatedModels = [];

        // Process each GPU model
        for (const model of gpuModels) {
            const match = findBestMatch(model.name);

            if (match) {
                const filename = `${model.slug}.jpg`;

                // Skip if we've already processed this image pattern
                if (processedImages.has(match.pattern)) {
                    // Just update the database record if needed
                    if (!model.image_url) {
                        updatedModels.push({
                            id: model.id,
                            image_url: `/images/gpus/${filename}`
                        });
                    }
                    continue;
                }

                try {
                    // Download the image
                    await downloadImage(match.url, filename);
                    processedImages.add(match.pattern);

                    // Add to list of models to update
                    updatedModels.push({
                        id: model.id,
                        image_url: `/images/gpus/${filename}`
                    });
                } catch (err) {
                    console.error(`❌ Error downloading image for ${model.name}:`, err.message);
                }
            } else {
                console.log(`⚠️ No image match found for ${model.name}`);
            }
        }

        // Update database records with image URLs if requested
        if (process.argv.includes('--update-db') && updatedModels.length > 0) {
            console.log(`\n💾 Updating ${updatedModels.length} database records...`);

            for (const model of updatedModels) {
                const { error } = await supabase
                    .from('gpu_models')
                    .update({ image_url: model.image_url })
                    .eq('id', model.id);

                if (error) {
                    console.error(`❌ Error updating record for ${model.id}:`, error.message);
                }
            }

            console.log('✅ Database update completed');
        } else if (updatedModels.length > 0) {
            console.log(`\n⚠️ ${updatedModels.length} database records need updating`);
            console.log('Run with --update-db flag to update the database');
        }

        console.log('\n✨ Process completed successfully');
    } catch (error) {
        console.error('❌ Script error:', error);
        process.exit(1);
    }
}

// Check for --dry-run flag
const dryRun = process.argv.includes('--dry-run');
if (dryRun) {
    console.log('🏃 DRY RUN: No images will be downloaded');
    // Simulate the process without downloading
} else {
    main();
} 