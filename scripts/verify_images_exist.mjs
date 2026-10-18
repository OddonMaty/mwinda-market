import fs from 'fs';
import path from 'path';

function walk(dir, list = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, list);
    else if (/\.(ts|tsx|js|json)$/.test(f)) list.push(p);
  }
  return list;
}

const files = walk('src');
const missing = [];
const checked = new Set();

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /["'](\/images\/[^"'\s]+)["']/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const imgPath = m[1];
    if (checked.has(imgPath)) continue;
    checked.add(imgPath);
    const diskPath = path.join('public', imgPath);
    if (!fs.existsSync(diskPath)) {
      missing.push({ file, imgPath, diskPath });
    }
  }
}

console.log('Total unique /images/ referenced:', checked.size);
console.log('Missing count:', missing.length);
if (missing.length > 0) {
  console.log('Missing files:', missing);
  process.exit(1);
} else {
  console.log('All referenced images exist in public/images/ !');
}
