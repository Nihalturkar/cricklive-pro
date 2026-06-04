/* ============ ICON GENERATOR (Run with Node.js if canvas available, or open generate-icons.html in browser) ============ */
/*
   USAGE:
   1. Open generate-icons.html in Chrome
   2. Click "Download" on each icon
   3. Save them to the /icons/ folder

   OR if you deploy to a server, the app will use the SVG icon as fallback
*/

// For quick deployment without PNGs, we create minimal 1x1 placeholder PNGs
// These will be replaced by the SVG icon at runtime

var fs = require('fs');
var path = require('path');

// Minimal valid PNG (1x1 transparent pixel) - serves as placeholder
// Real icons should be generated from generate-icons.html
var PNG_HEADER = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, // 8-bit RGBA
    0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
    0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
    0xE5, 0x27, 0xDE, 0xFC,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
    0xAE, 0x42, 0x60, 0x82
]);

var sizes = [72, 96, 128, 144, 152, 192, 384, 512];
var iconsDir = path.join(__dirname, 'icons');

sizes.forEach(function(size) {
    var filePath = path.join(iconsDir, 'icon-' + size + '.png');
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, PNG_HEADER);
        console.log('Created placeholder: icon-' + size + '.png');
    }
});

console.log('\nPlaceholder icons created!');
console.log('For proper icons, open generate-icons.html in Chrome and download each icon.');
