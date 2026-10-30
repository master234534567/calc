const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'games-manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.error("games-manifest.json not found!");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Clean up entries: ensure each item has proper string values or fallback nicely
const cleaned = data.map(g => {
  if (typeof g === 'string') {
    // Convert string paths into proper objects if your UI expects objects
    const name = path.basename(g, '.html').replace(/-/g, ' ');
    return {
      title: name.charAt(0).toUpperCase() + name.slice(1),
      url: g
    };
  }
  return {
    title: g.title || "Unknown Game",
    url: g.url || "#"
  };
});

fs.writeFileSync(manifestPath, JSON.stringify(cleaned, null, 2), 'utf8');
console.log(`Successfully fixed manifest! Total games: ${cleaned.length}`);
