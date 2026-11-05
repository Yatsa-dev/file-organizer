import { DuplicateFinder } from "../lib/duplicate-finder.js";
import { drawProgressBar, formatSize, showError } from "../lib/utils.js";

export async function duplicatesAction(directory) {
  const finder = new DuplicateFinder();

  finder.on("duplicates-start", (data) => {
    console.log(`\n🔍 Searching for duplicates in: ${data.directory}`);
  });

  let processedFiles = 0;
  finder.on("file-processed", ({ path, hash }) => {
    processedFiles += 1;
  });

  finder.on("progress", ({ current, total }) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`Processing... ${drawProgressBar(current, total)}`);
  });

  finder.on("error", (err, dir) => {
    showError(err, dir);
    process.exit(1);
  });

  finder.on("duplicates-found", ({ duplicates, wastedSpace }) => {
    console.log(
      `\n\nFound ${duplicates.length} duplicate groups (${formatSize(wastedSpace)} wasted):\n`,
    );

    duplicates.forEach((group, i) => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(
        `Group ${i + 1} (${group.filePaths.length} copies, ${formatSize(group.size)} each):`,
      );
      console.log(`  SHA-256: ${group.hash.substring(0, 12)}...\n`);

      group.filePaths.forEach((p) => console.log(`  📄 ${p}`));
      console.log(`\n  Wasted space: ${formatSize(group.waste)}\n`);
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`💾 Total wasted space: ${formatSize(wastedSpace)}\n`);
  });

  await finder.findDuplicates(directory);
}
