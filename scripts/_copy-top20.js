import fs from 'node:fs';
import path from 'node:path';

const src = path.join(process.env.TEMP || '/tmp', 'top20.json');
const dst = path.resolve('scripts/top20.json');
fs.copyFileSync(src, dst);
console.log(`Copied ${src} -> ${dst}`);
console.log(`Size: ${fs.statSync(dst).size} bytes`);
