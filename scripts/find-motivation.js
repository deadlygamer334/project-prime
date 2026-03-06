const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

async function findMotivationVideos() {
    try {
        console.log('--- Searching for Motivation Videos ---');

        // Search for videos, excluding 'wallpapers' folder if possible
        const result = await cloudinary.search
            .expression('resource_type:video')
            .sort_by('public_id', 'desc')
            .max_results(100)
            .execute();

        console.log(`Found ${result.resources.length} videos.`);

        const motivationKeywords = ['motivation', 'hustle', 'success', 'focus', 'reel', 'short'];
        const likelyMotivation = result.resources.filter(r => {
            const name = r.public_id.toLowerCase();
            return motivationKeywords.some(kw => name.includes(kw));
        });

        console.log(`\nLikely Motivation Videos (${likelyMotivation.length}):`);
        likelyMotivation.forEach(r => {
            console.log(`- ${r.public_id} (Folder: ${r.folder})`);
        });

        if (likelyMotivation.length === 0 && result.resources.length > 0) {
            console.log('\nNo obvious motivation videos found by keyword. Showing last 20 videos:');
            result.resources.slice(0, 20).forEach(r => {
                console.log(`- ${r.public_id} (Folder: ${r.folder})`);
            });
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

findMotivationVideos();
