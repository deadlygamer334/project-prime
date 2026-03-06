const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

async function checkStats() {
    try {
        console.log('--- Cloudinary Stats ---');
        const rootFolders = await cloudinary.api.root_folders();
        console.log('Root Folders:', rootFolders.folders.map(f => f.name));

        // List all resource types
        const types = ['image', 'video', 'raw'];
        for (const type of types) {
            const res = await cloudinary.api.resources({ resource_type: type, max_results: 1 });
            console.log(`${type} count (approx): ${res.total_count || 'unknown'}`);
        }

        // Check tags
        const tags = await cloudinary.api.tags();
        console.log('Tags:', tags.tags);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkStats();
