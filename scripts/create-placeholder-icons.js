// This script creates simple placeholder PWA icons
// Run with: node scripts/create-placeholder-icons.js
const fs = require('fs')
const path = require('path')

// Simple SVG template for icons
const createIconSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.125}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.35}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">OR</text>
</svg>`

const publicDir = path.join(__dirname, '../public')

// Create SVG icons (can be converted to PNG later)
const sizes = [192, 512]
sizes.forEach(size => {
  const svg = createIconSVG(size)
  const filename = `icon-${size}x${size}.svg`
  fs.writeFileSync(path.join(publicDir, filename), svg)
  console.log(`Created ${filename}`)
})

console.log('\n✅ Placeholder SVG icons created!')
console.log('\n📝 Next steps:')
console.log('1. Open the SVG files in an image editor (Figma, Inkscape, etc.)')
console.log('2. Export them as PNG files with the same names')
console.log('3. Or use an online converter: https://cloudconvert.com/svg-to-png')
console.log('\nFor now, the app will work without icons, but PWA installation may not show custom icons.')

