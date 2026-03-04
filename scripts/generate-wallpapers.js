const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = __dirname;
const ROOT_DIR = path.resolve(SCRIPTS_DIR, '..');
const DATA_DIR = path.resolve(ROOT_DIR, 'data');
const CONFIG_FILE = path.resolve(SCRIPTS_DIR, 'wallpapers.config.json');
const OUTPUT_FILE = path.resolve(DATA_DIR, 'wallpapers.json');

function generate() {
    console.log('--- Wallpaper Pipeline ---');

    // 1. Auto-create data folder
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // 2. Read config
    if (!fs.existsSync(CONFIG_FILE)) {
        console.error('❌ Error: wallpapers.config.json missing.');
        process.exit(1);
    }

    let config;
    try {
        config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
        console.error('❌ Error: JSON syntax error in config.');
        process.exit(1);
    }

    const { cloudName, images = [], videos = [] } = config;

    // 3. Validation
    if (!cloudName || cloudName === 'YOUR_CLOUD_NAME_HERE') {
        console.error('❌ Validation Failed: cloudName is required.');
        process.exit(1);
    }

    const ids = new Set();
    const processItems = (items) => {
        for (const item of items) {
            if (!item.id || !item.path) {
                console.error(`❌ Validation Failed: Missing id or path on ${JSON.stringify(item)}`);
                process.exit(1);
            }
            if (ids.has(item.id)) {
                console.error(`❌ Validation Failed: Duplicate ID found -> ${item.id}`);
                process.exit(1);
            }
            if (!item.path.includes('/source/')) {
                console.error(`❌ Validation Failed: Path must include "/source/". Failed on -> ${item.path}`);
                process.exit(1);
            }
            ids.add(item.id);
        }
    };

    processItems(images);
    processItems(videos);

    // 4. Transform Rules
    const BASE_URL = `https://res.cloudinary.com/${cloudName}`;
    const wallpapers = [];

    // Images
    images.forEach(img => {
        const fullUrl = `${BASE_URL}/image/upload/w_2560,f_auto,q_auto/${img.path}`;
        const previewUrl = `${BASE_URL}/image/upload/w_1200,f_auto,q_auto/${img.path}`;
        const thumbUrl = `${BASE_URL}/image/upload/w_300,f_auto,q_auto/${img.path}`;

        wallpapers.push({
            id: img.id,
            type: 'image',
            category: img.category || 'general',
            src: fullUrl,
            preview: previewUrl,
            thumbnail: thumbUrl
        });
    });

    // Videos
    videos.forEach(vid => {
        const videoFullUrl = `${BASE_URL}/video/upload/w_1920,f_auto,q_auto,vc_h264/${vid.path}`;

        // Poster extraction from video requires changing extension to .jpg in Cloudinary URL
        // Cloudinary uses the image endpoint to get video frames
        const posterPath = vid.path.replace(/\.[^/.]+$/, "") + ".jpg";

        const posterEditorUrl = `${BASE_URL}/video/upload/so_0,w_1200,f_auto,q_auto/${posterPath}`;
        const thumbUrl = `${BASE_URL}/video/upload/so_0,w_300,f_auto,q_auto/${posterPath}`;

        wallpapers.push({
            id: vid.id,
            type: 'video',
            category: vid.category || 'general',
            src: videoFullUrl,
            poster: posterEditorUrl,
            thumbnail: thumbUrl,
            duration: vid.duration || 0
        });
    });

    // 5. Output
    try {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(wallpapers, null, 2), 'utf8');
        console.log(`✅ Success: ${wallpapers.length} wallpapers generated.`);
        console.log(`   📸 Images: ${images.length}`);
        console.log(`   🎥 Videos: ${videos.length}`);
        if (wallpapers.length > 0) {
            console.log('\nSample URL:');
            console.log(wallpapers[0].src);
        }
        process.exit(0);
    } catch (e) {
        console.error('❌ Error writing to wallpapers.json:', e.message);
        process.exit(1);
    }
}

generate();
