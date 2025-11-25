const fs = require('fs');
const path = require('path');

const presetsPath = path.join(__dirname, '../public/practice-presets.json');
const data = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));

const categories = {};
data.presets.forEach(p => {
  categories[p.category] = (categories[p.category] || 0) + 1;
});

console.log('Presets by category:');
Object.entries(categories).sort((a,b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}`);
});

console.log(`\nTotal presets: ${data.presets.length}`);
console.log(`Version: ${data.version}`);

