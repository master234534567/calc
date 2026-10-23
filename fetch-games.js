const fs = require('fs');
const path = require('path');
const https = require('https');

const sources = [
  { owner: 'CoolDude2349', repo: 'Offline-HTML-Games-Pack', folder: 'offline', target: './offline-games' },
  { owner: 'Gams-Offline', repo: 'Gams', folder: '', target: './gams' },
  { owner: 'UBGHyper', repo: 'ubg42.github.io', folder: 'games', target: './ubg-games' }
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Node.js-Codespace-Scraper' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return makeRequest(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: null });
        }
      });
    });
    req.on('error', reject);
  });
}

async function fetchCompleteTree(owner, repo) {
  const branches = ['master', 'main'];
  for (const branch of branches) {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    const response = await makeRequest(url);
    if (response.statusCode === 200 && response.body && response.body.tree) {
      console.log(`Successfully fetched tree from branch '${branch}' for ${repo}`);
      return { branch, tree: response.body.tree };
    }
  }
  return { branch: null, tree: [] };
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
  console.log('--- Starting Deep Search for All Game HTML Files ---');
  let totalDownloaded = 0;

  for (const src of sources) {
    console.log(`\nScanning ${src.owner}/${src.repo}...`);
    const { branch, tree } = await fetchCompleteTree(src.owner, src.repo);

    if (!tree || tree.length === 0) {
      console.log(`Warning: Could not fetch tree for ${src.owner}/${src.repo}`);
      continue;
    }

    const htmlFiles = tree.filter(item => {
      const isHtml = item.path.toLowerCase().endsWith('.html') || item.path.toLowerCase().endsWith('.htm');
      const inFolder = src.folder ? item.path.startsWith(src.folder) : true;
      return item.type === 'blob' && isHtml && inFolder;
    });

    console.log(`Found ${htmlFiles.length} HTML files in ${src.repo} on branch '${branch}'.`);

    for (const file of htmlFiles) {
      const rawUrl = `https://raw.githubusercontent.com/${src.owner}/${src.repo}/${branch}/${file.path}`;
      const relativePath = src.folder ? file.path.substring(src.folder.length).replace(/^\//, '') : file.path;
      const localPath = path.join(src.target, relativePath);
      
      await downloadFile(rawUrl, localPath);
      totalDownloaded++;
    }
  }

  console.log(`\nSuccess! Downloaded a total of ${totalDownloaded} HTML game files.`);
}

run();
