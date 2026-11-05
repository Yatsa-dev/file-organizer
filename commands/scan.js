import { Scanner } from "../lib/scanner.js";
import { drawProgressBar, formatSize, showError } from "../lib/utils.js";

export async function scanAction(directory) {
  const scanner = new Scanner();

  scanner.on("scan-start", ({ directory }) => {
    console.log(`\n📂 Scanning: ${directory}`);
    process.stdout.write("Processing... ");
  });

  let processedFiles = 0;
  scanner.on("file-found", ({ path, size }) => {
    processedFiles += 1;
  });

  scanner.on("progress", ({ total, current }) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`Processing... ${drawProgressBar(current, total)}`);
  });

  scanner.on("error", (err, dir) => {
    showError(err, dir);
    process.exit(1);
  });

  scanner.on("scan-complete", (stats) => {
    console.log(`\n\n📊 Scan Results:`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Total files: ${stats.totalFiles}`);
    console.log(`Total size: ${formatSize(stats.totalSize)}\n`);

    console.log("By File Type:");
    const sortedTypes = Array.from(stats.byType.entries()).sort(
      (a, b) => b[1].count - a[1].count,
    );
    for (const [ext, data] of sortedTypes) {
      const count = String(data.count).padStart(5);
      const size = formatSize(data.totalSize).padStart(10);
      console.log(`  ${ext.padEnd(10)} ${count} files   ${size}`);
    }

    console.log("\nFile Age:");
    console.log(`  Last 7 days:    ${stats.byAge.last7Days} files`);
    console.log(`  Last 30 days:   ${stats.byAge.last30Days} files`);
    console.log(`  Older than 90:  ${stats.byAge.olderThan90} files`);

    console.log("\nLargest files:");
    stats.largestFiles.forEach((f, i) => {
      console.log(
        `  ${i + 1}. ${f.name.padEnd(30)} ${formatSize(f.size).padStart(10)}`,
      );
    });

    if (stats.oldestFile) {
      const d = new Date(stats.oldestFile.mtime);
      console.log(
        `\nOldest file: ${stats.oldestFile.name} (modified ${stats.oldestFile.daysOld} days ago on ${d.toISOString().split("T")[0]})`,
      );
    }
  });

  await scanner.scan(directory);
}
