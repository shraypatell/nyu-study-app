const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'classes_upload_fixed.json');
const classes = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

const BATCH_SIZE = 200;
const API_URL = 'http://localhost:3000/api/admin/classes';

async function uploadBatch(batch, batchNumber, totalBatches) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log(
      `[${batchNumber}/${totalBatches}] Created: ${result.summary.created}, Skipped: ${result.summary.skipped}, Errors: ${result.summary.errors}`
    );
    return result.summary;
  } catch (error) {
    console.error(`[${batchNumber}/${totalBatches}] Error: ${error.message}`);
    return { created: 0, skipped: 0, errors: batch.length };
  }
}

async function uploadAll() {
  console.log(`Starting upload of ${classes.length} classes in batches of ${BATCH_SIZE}...\n`);

  const totalBatches = Math.ceil(classes.length / BATCH_SIZE);
  let totalCreated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (let i = 0; i < classes.length; i += BATCH_SIZE) {
    const batch = classes.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

    const summary = await uploadBatch(batch, batchNumber, totalBatches);
    totalCreated += summary.created;
    totalSkipped += summary.skipped;
    totalErrors += summary.errors;

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('\n========================================');
  console.log('UPLOAD COMPLETE');
  console.log('========================================');
  console.log(`Total Created: ${totalCreated}`);
  console.log(`Total Skipped: ${totalSkipped}`);
  console.log(`Total Errors:  ${totalErrors}`);
  console.log(`Total Classes: ${totalCreated + totalSkipped + totalErrors}`);
}

uploadAll().catch(console.error);
