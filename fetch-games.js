const fs = require('fs');
const path = require('path');
const https = require('https');

const sources = [
  { owner: 'CoolDude2349', repo: 'Offline-HTML-Games-Pack', folder: 'offline', target: './offline-games' },
  { owner: 'Gams-Offline', repo: 'Gams', folder: '', target: './gams' },
  { owner: 'UBGHyper', repo: 'ubg42.github.io', folder: 'games', target: './ubg-games' }
];

async function fetchRepoTree(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Node.js' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          // Try 'master' branch if 'main' fails
          const fallbackUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`;
          https.get(fallbackUrl, { headers: { 'User-Agent': 'Node.js' } }, (res2) => {
            let data2 = '';
            res2.on('data', chunk => data2 += chunk);
            res2.on('end', () => resolve(JSON.parse(data2)));
          });
        }
      });
    });
    req.on('error', reject);
  });
}

async function downloadFile(rawUrl, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  return new Promise((resolve) => {
    https.get(rawUrl, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return downloadFile(res.headers.location, destPath).then(resolve);
      }
      const stream = fs.createWriteStream(destPath);
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        resolve();
      });
    });
  });
}

async function run() {
  console.log('Finding and downloading all game HTML files...');
  for (const src of sources) {
    console.log(`\nScanning ${src.owner}/${src.repo}...`);
    const treeData = await fetchRepoTree(src.owner, src.repo);
    
    if (!treeData.tree) {
      console.log(`Failed to fetch tree for ${src.repo}`);
      continue;
    }

    const htmlFiles = treeData.tree.filter(item => {
      const isHtml = item.path.endsWith('.html');
      const inFolder = src.folder ? item.path.startsWith(src.folder) : true;
      return item.type === 'blob' && isHtml && inFolder;
    });

    console.log(`Found ${htmlFiles.length} HTML files.`);

    for (const file of htmlFiles) {
      const rawUrl = `https://raw.githubusercontent.com/${src.owner}/${src.repo}/HEAD/${file.path}`;
      const localPath = path.join(src.target, file.path.replace(src.folder, ''));
      console.log(`Downloading: ${file.path}`);
      await downloadFile(rawUrl, localPath);
    }
  }
  console.log('\nDone downloading all HTML game files!');
}

run();
