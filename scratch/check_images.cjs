const fs = require('fs');
const path = require('path');

const menuContent = fs.readFileSync('src/data/menu.js', 'utf8');
const publicDir = 'public';

const imageRegex = /image: "(.*?)"/g;
let match;
const missingImages = [];

while ((match = imageRegex.exec(menuContent)) !== null) {
  const imagePath = match[1];
  if (imagePath.startsWith('/')) {
    const fullPath = path.join(publicDir, imagePath.substring(1));
    if (!fs.existsSync(fullPath)) {
      missingImages.push(imagePath);
    }
  } else if (imagePath.startsWith('http')) {
    // Skip external URLs
  }
}

console.log('Missing Images:');
console.log(JSON.stringify(missingImages, null, 2));
