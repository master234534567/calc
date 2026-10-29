const fs = require('fs');

const games = [
  { title: "Thats Not My Neighbor", url: "https://s3.amazonaws.com/prageru-server/mathematics.html?id=216" },
  { title: "R.E.P.O", url: "https://s3.amazonaws.com/prageru-server/mathematics.html?id=195" },
  { title: "Celeste", url: "https://s3.amazonaws.com/prageru-server/mathematics.html?id=623" },
  { title: "Bendy and the ink machine", url: "https://s3.amazonaws.com/prageru-server/mathematics.html?id=215" },
  { title: "60 Seconds", url: "https://s3.amazonaws.com/prageru-server/mathematics.html?id=858" },
  { title: "They are Coming", url: "https://s3.amazonaws.com/prageru-server/mathematics.html?id=348" }
];
let existingGames = [];

if (fs.existsSync('games-manifest.json')) {
  try {
    const data = fs.readFileSync('games-manifest.json', 'utf8');
    existingGames = JSON.parse(data);
  } catch (err) {
    console.log('Manifest was empty or invalid, starting fresh.');
  }
}

// Combine old and new games safely
const combinedGames = [...existingGames, ...newGames];

fs.writeFileSync('games-manifest.json', JSON.stringify(combinedGames, null, 2));
console.log('✅ games-manifest.json updated successfully!');




