const fs = require('fs');
const all = JSON.parse(fs.readFileSync('C:/Users/Dell/Desktop/TheDripMap/scripts/email-discovery-batch.json', 'utf8'));
const N = 6;
const size = Math.ceil(all.length / N);
for (let i = 0; i < N; i++) {
  const chunk = all.slice(i * size, (i + 1) * size);
  fs.writeFileSync(`C:/Users/Dell/Desktop/TheDripMap/scripts/email-discovery-chunk-${i + 1}.json`, JSON.stringify(chunk, null, 2));
  console.log(`Chunk ${i + 1}: ${chunk.length} candidates`);
}
