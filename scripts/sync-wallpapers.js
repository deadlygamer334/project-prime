require('dotenv').config({ path: '.env.local' });
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// --- 1. CONFIGURATION ---
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
    console.error('❌ Error: Missing Cloudinary credentials in .env.local');
    console.log('Please add:');
    console.log('CLOUDINARY_CLOUD_NAME=...');
    console.log('CLOUDINARY_API_KEY=...');
    console.log('CLOUDINARY_API_SECRET=...');
    process.exit(1);
}

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
});

const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(DATA_DIR, 'wallpapers.json');

// --- 2. ASSET FETCHING ---
async function fetchAllAssets() {
    let allAssets = [];
    let nextCursor = null;

    console.log(`🔍 Searching for all assets in "wallpapers/" folders...`);

    try {
        do {
            const result = await cloudinary.search
                .expression('folder:wallpapers/*')
                .sort_by('public_id', 'asc')
                .max_results(500)
                .next_cursor(nextCursor)
                .execute();

            allAssets = allAssets.concat(result.resources);
            nextCursor = result.next_cursor;

            if (nextCursor) {
                console.log(`   ...Fetched ${allAssets.length} items so far, continuing with next page...`);
            }
        } while (nextCursor);

        return allAssets;
    } catch (error) {
        console.error(`❌ Error searching Cloudinary assets:`, error.message);
        throw error;
    }
}

// --- 3. URL GENERATION LOGIC ---
function transformAsset(asset, resourceType) {
    const publicId = asset.public_id;
    const id = publicId.split('/').pop(); // Last segment of public_id

    // Default categories or extract from folder structure if possible
    // Here we just use "general" as requested, but could be inferred from publicId
    const category = "general";

    if (resourceType === 'image') {
        const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
        return {
            id: id,
            type: 'image',
            category: category,
            thumb: `${baseUrl}/w_300,f_auto,q_auto/${publicId}`,
            preview: `${baseUrl}/w_1200,f_auto,q_auto/${publicId}`,
            // Use the exact original URL for maximum quality
            full: asset.secure_url
        };
    } else if (resourceType === 'video') {
        const videoBaseUrl = `https://res.cloudinary.com/${cloudName}/video/upload`;

        // Construct poster path (ID without extension)
        const posterId = publicId.replace(/\.[^/.]+$/, "");

        return {
            id: id,
            type: 'video',
            category: category,
            thumb: `${videoBaseUrl}/so_0,w_300,f_auto,q_auto/${posterId}.jpg`,
            poster: `${videoBaseUrl}/so_0,w_1200,f_auto,q_auto/${posterId}.jpg`,
            preview: `${videoBaseUrl}/w_1200,f_auto,q_auto,vc_h264/${publicId}`,
            // Use the exact original URL for maximum quality
            full: asset.secure_url
        };
    }
}

// --- 4. MAIN SYNC EXECUTION ---
async function sync() {
    console.log('🚀 Starting Cloudinary Sync Pipeline (Search API)...');

    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    try {
        const allAssets = await fetchAllAssets();

        const imageAssets = allAssets.filter(a => a.resource_type === 'image');
        const videoAssets = allAssets.filter(a => a.resource_type === 'video');

        console.log(`\n✅ Found ${imageAssets.length} images.`);
        console.log(`✅ Found ${videoAssets.length} videos.`);

        const wallpapers = allAssets
            .filter(a => a.resource_type === 'image' || a.resource_type === 'video')
            .map(a => transformAsset(a, a.resource_type));

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(wallpapers, null, 2), 'utf8');

        console.log(`\n✨ Successfully generated wallpapers.json with ${wallpapers.length} assets.`);
        console.log(`📍 Output: ${OUTPUT_FILE}`);

        if (wallpapers.length > 0) {
            console.log('\n--- Sanity Check (Sample URL) ---');
            console.log(wallpapers[0].full);
            console.log('--------------------------------\n');
        }

    } catch (error) {
        console.error('\n❌ Sync Failed:', error.message);
        process.exit(1);
    }
}

sync();
