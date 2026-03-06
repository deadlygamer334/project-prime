const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

async function listAllVideos() {
    try {
        console.log('--- Listing All Videos ---');
        let nextCursor = null;
        let allVideos = [];

        do {
            const result = await cloudinary.api.resources({
                resource_type: 'video',
                max_results: 500,
                next_cursor: nextCursor
            });

            allVideos = allVideos.concat(result.resources);
            nextCursor = result.next_cursor;
            console.log(`Fetched ${allVideos.length} videos...`);
        } while (nextCursor && allVideos.length < 1000);

        const data = allVideos.map(v => ({
            public_id: v.public_id,
            folder: v.folder,
            created_at: v.created_at,
            url: v.secure_url
        }));

        const fs = require('fs');
        fs.writeFileSync('cloudinary_videos.json', JSON.stringify(data, null, 2));
        console.log(`\nSaved ${data.length} videos to cloudinary_videos.json`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

listAllVideos();
