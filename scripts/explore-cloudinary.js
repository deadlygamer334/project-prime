const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

async function explore() {
    try {
        console.log('--- Cloudinary Exploration ---');

        // Check root folders
        const folders = await cloudinary.api.root_folders();
        console.log('Root Folders:', folders.folders.map(f => f.name));

        for (const folder of folders.folders) {
            const sub = await cloudinary.api.sub_folders(folder.name);
            if (sub.folders.length > 0) {
                console.log(`Sub-folders of ${folder.name}:`, sub.folders.map(f => f.name));
            }
        }

        // Search for videos
        const result = await cloudinary.search
            .expression('resource_type:video')
            .max_results(20)
            .execute();

        console.log('\nSample Videos (First 20):');
        result.resources.forEach(r => {
            console.log(`- ${r.public_id} (Folder: ${r.folder})`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

explore();
