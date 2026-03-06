const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// New Cloudinary Credentials
const cloudName = 'dziqhiogp';
const apiKey = '224718471884365';
const apiSecret = 'Y-ueXihVRtLJYvGZeU4jB-wDE6I';

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
});

const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(DATA_DIR, 'motivation-videos.json');

async function syncMotivation() {
    console.log('🚀 Starting Motivation Video Sync...');

    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    try {
        let allResources = [];
        let nextCursor = null;

        do {
            const result = await cloudinary.search
                .expression('resource_type:video')
                .max_results(500)
                .next_cursor(nextCursor)
                .execute();

            allResources = allResources.concat(result.resources);
            nextCursor = result.next_cursor;
            console.log(`   Fetched ${allResources.length} videos...`);
        } while (nextCursor);

        console.log(`\n✅ Found ${allResources.length} total videos.`);

        // Sort by creation date (ascending) to assign numbers
        allResources.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        const processedVideos = allResources.map((v, index) => {
            const publicId = v.public_id;
            // Cloudinary optimizations:
            // f_auto: automatic format selection (WebM, MP4, etc.)
            // q_auto: automatic quality compression
            // vc_h264: ensure H.264 for wide compatibility
            const optimizedUrl = `https://res.cloudinary.com/${cloudName}/video/upload/f_auto,q_auto,vc_h264/${publicId}.mp4`;

            return {
                id: publicId,
                reelNumber: index + 1,
                url: optimizedUrl,
                publicId: publicId,
                duration: v.duration
            };
        });

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processedVideos, null, 2));
        console.log(`\n✨ Successfully saved ${processedVideos.length} videos to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('❌ Sync Failed:', error.message);
        process.exit(1);
    }
}

syncMotivation();
