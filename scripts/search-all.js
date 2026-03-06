const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

async function searchAll() {
    try {
        console.log('--- Searching All Resources ---');
        let nextCursor = null;
        let allResources = [];

        do {
            const result = await cloudinary.search
                .expression('resource_type:video')
                .max_results(500)
                .next_cursor(nextCursor)
                .execute();

            allResources = allResources.concat(result.resources);
            nextCursor = result.next_cursor;
            console.log(`Found ${allResources.length} videos...`);
        } while (nextCursor);

        console.log(`\nTotal Videos Found: ${allResources.length}`);

        // Group by folder
        const folders = {};
        allResources.forEach(r => {
            const f = r.folder || 'root';
            folders[f] = (folders[f] || 0) + 1;
        });
        console.log('Folders found:', folders);

        const first10 = allResources.slice(0, 10).map(r => r.public_id);
        console.log('Sample IDs:', first10);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

searchAll();
