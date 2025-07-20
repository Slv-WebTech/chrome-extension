// scripts/post-build.js
// Post-build script to optimize the extension for Chrome Web Store

const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');

console.log('🔧 Running post-build optimizations...');

try {
    // Remove unnecessary files for Chrome extension
    const filesToRemove = [
        'asset-manifest.json',
        'robots.txt'
    ];

    filesToRemove.forEach(file => {
        const filePath = path.join(buildDir, file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ Removed ${file}`);
        }
    });

    // Update manifest.json to ensure correct Chrome extension format
    const manifestPath = path.join(buildDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        // Ensure proper Chrome extension manifest
        manifest.manifest_version = 3;
        manifest.name = "Daily Boost - Motivation & Weather";
        manifest.version = "1.0.0";

        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log('✅ Updated manifest.json');
    }

    // Create a simple readme in build folder
    const readmePath = path.join(buildDir, 'README.txt');
    const readmeContent = `
Daily Boost Chrome Extension - Build ${new Date().toISOString()}

To install this extension:
1. Open Chrome and go to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select this folder

For more information, see BUILD_INSTRUCTIONS.md in the project root.
`;

    fs.writeFileSync(readmePath, readmeContent.trim());
    console.log('✅ Created installation README');

    console.log('🎉 Post-build optimization complete!');
    console.log('📂 Extension ready in build/ folder');
    console.log('🚀 You can now load this as an unpacked extension in Chrome');

} catch (error) {
    console.error('❌ Post-build script failed:', error);
    process.exit(1);
}
