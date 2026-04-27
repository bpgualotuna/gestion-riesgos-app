const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src'); // adjust path as needed
const regex = /íƒ.{1,3}/g;
const found = new Map();

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
        const hex = Array.from(match[0]).map(c => c.charCodeAt(0).toString(16)).join(' ');
        if (!found.has(match[0])) {
           found.set(match[0], hex);
        }
      }
    }
  }
}

walk(path.join(process.cwd(), 'src'));
console.log(Array.from(found.entries()));
