const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'games-manifest.json');

// 1. Define the new games you want to add
const newGames = [
  {
    title: "60 Seconds",
    url: "./gamelist/60-seconds.html"
  }
];

// 2. Read existing games from games-manifest.json if it exists
let existingGames = [];
if (fs.existsSync(manifestPath)) {
  try {
    const rawData = fs.readFileSync(manifestPath, 'utf8');
    existingGames = JSON.parse(rawData);
    console.log(`Loaded ${existingGames.length} existing games from manifest.`);
  } catch (err) {
    console.error("Error reading existing manifest, starting with empty array:", err.message);
  }
}

// 3. Merge new games safely while guarding against missing properties
newGames.forEach(newGame => {
  const exists = existingGames.some(g => {
    if (!g) return false;
    const matchUrl = g.url && g.url === newGame.url;
    const matchTitle = g.title && newGame.title && g.title.toLowerCase() === newGame.title.toLowerCase();
    return matchUrl || matchTitle;
  });

  if (!exists) {
    existingGames.push(newGame);
    console.log(`Added new game: ${newGame.title}`);
  } else {
    console.log(`Game already in manifest: ${newGame.title}`);
  }
});

// 4. Save the combined list back to games-manifest.json
fs.writeFileSync(manifestPath, JSON.stringify(existingGames, null, 2), 'utf8');
console.log(`Manifest updated successfully! Total games: ${existingGames.length}`);