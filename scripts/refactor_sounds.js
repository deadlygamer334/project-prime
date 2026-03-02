const fs = require('fs');
const path = require('path');

const jsonPath = path.join(process.cwd(), 'src', 'data', 'focusSounds.json');
const soundsDir = path.join(process.cwd(), 'public', 'sounds');

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const renameSound = (sound) => {
    const oldFilename = sound.audioSrc.split('/').pop();
    const newFilename = `${sound.id}.mp3`;
    const oldPath = path.join(soundsDir, oldFilename);
    const newPath = path.join(soundsDir, newFilename);

    if (fs.existsSync(oldPath)) {
        console.log(`Renaming: ${oldFilename} -> ${newFilename}`);
        fs.renameSync(oldPath, newPath);
        sound.audioSrc = `/sounds/${newFilename}`;
    } else if (fs.existsSync(newPath)) {
        console.log(`Already renamed: ${newFilename}`);
        sound.audioSrc = `/sounds/${newFilename}`;
    } else {
        console.warn(`File not found: ${oldFilename}`);
    }
};

Object.keys(data).forEach(cat => {
    if (Array.isArray(data[cat])) {
        data[cat].forEach(renameSound);
    }
});

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 4));
console.log('Update complete.');
