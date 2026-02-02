const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'classes_upload.json');
const outputFile = path.join(__dirname, 'classes_upload_fixed.json');

console.log('Reading classes...');
const classes = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
console.log(`Total classes: ${classes.length}`);

let truncatedCount = 0;
const fixedClasses = classes.map((cls, index) => {
  if (cls.name && cls.name.length > 200) {
    const originalLength = cls.name.length;
    cls.name = cls.name.substring(0, 197) + '...';
    truncatedCount++;
    if (truncatedCount <= 5) {
      console.log(`[${index}] Truncated: "${cls.name.substring(0, 50)}..." (${originalLength} -> 200 chars)`);
    }
  }
  return cls;
});

console.log(`\nTruncated ${truncatedCount} class names`);

fs.writeFileSync(outputFile, JSON.stringify(fixedClasses, null, 2));
console.log(`Fixed file written to: ${outputFile}`);
console.log(`Ready for upload!`);
