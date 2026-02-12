const { execSync } = require('child_process');

const commitMessage = process.argv[2];

if (!commitMessage) {
    console.error('❌ Error: Please provide a commit message.');
    console.error('Usage: npm run ship -- "Your commit message"');
    process.exit(1);
}

try {
    console.log('🔍 Running TypeScript check...');
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    console.log('✅ TypeScript check passed.');

    console.log('📦 Staging files...');
    execSync('git add .', { stdio: 'inherit' });

    console.log('wm Committing...');
    // Escape quotes in commit message to prevent shell issues
    const safeMessage = commitMessage.replace(/"/g, '\\"');
    execSync(`git commit -m "${safeMessage}"`, { stdio: 'inherit' });

    console.log('🚀 Pushing to origin main...');
    execSync('git push origin main', { stdio: 'inherit' });

    console.log('✅ Successfully shipped!');
} catch (error) {
    console.error('❌ Error during ship process:', error.message);
    process.exit(1);
}
