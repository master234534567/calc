const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'games-manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.error("games-manifest.json not found!");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Convert everything back to a plain string URL/path
const flatList = data.map(g => {
  if (typeof g === 'string') return g;
  return g.url || '';
}).filter(Boolean);

fs.writeFileSync(manifestPath, JSON.stringify(flatList, null, 2), 'utf8');
console.log(`Reverted manifest to string paths! Total items: ${flatList.length}`);
