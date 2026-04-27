const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../../../../src'); // adjust path as needed
const regex = /íƒ.{1,2}/g;
const found = new Set();

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.match(/\.(ts|tsx|js|jsx)$/)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      let match;
      while ((match = regex.exec(content)) !== null) {
        found.add(match[0]);
      }
    }
  }
}

walk(path.join(process.cwd(), 'src'));
console.log(Array.from(found));
