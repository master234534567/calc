const fs = require('fs');
const path = require('path');

const directories = ['offline-games', 'gams', 'ubg-games'];
let gameLinks = [];

function findGames(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      findGames(fullPath);
    } else if (item.name.toLowerCase() === 'index.html') {
      const gameName = path.basename(path.dirname(fullPath));
      gameLinks.push({ name: gameName, path: fullPath });
    }
  }
}

directories.forEach(findGames);

console.log(`Found ${gameLinks.length} playable games to embed.`);

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Embedded Arcade</title>
  <style>
    body { font-family: sans-serif; background: #121212; color: #fff; margin: 0; padding: 20px; }
    h1 { text-align: center; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; padding: 20px 0; }
    .card { background: #1e1e1e; border-radius: 8px; overflow: hidden; border: 1px solid #333; }
    .card h3 { margin: 10px; font-size: 16px; text-transform: capitalize; }
    iframe { width: 100%; height: 250px; border: none; background: #000; }
  </style>
</head>
<body>
  <h1>Game Arcade (${gameLinks.length} Games)</h1>
  <div class="grid">
    ${gameLinks.map(g => `
      <div class="card">
        <h3>${g.name.replace(/[-_]/g, ' ')}</h3>
        <iframe src="./${g.path}" loading="lazy"></iframe>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

fs.writeFileSync('index.html', htmlContent);
console.log('Successfully generated index.html with embedded games!');
