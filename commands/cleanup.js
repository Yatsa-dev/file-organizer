import { Cleanup } from "../lib/cleanup.js";
import { drawProgressBar, formatSize, showError } from "../lib/utils.js";

export async function cleanupAction(directory, options) {
  const cleanup = new Cleanup();

  cleanup.on("cleanup-start", ({ directory, thresholdDays }) => {
    console.log(`\n🧹 Cleanup: ${directory}`);
    console.log(`Looking for files older than ${thresholdDays} days...\n`);
  });

  let foundCount = 0;
  cleanup.on("file-found", () => {
    foundCount++;
  });

  cleanup.on("error", (err, dir) => {
    showError(err, dir);
    process.exit(1);
  });

  cleanup.on("finish-analize", ({ files, totalFreed }) => {
    if (files.length === 0) {
      console.log(`No files to delete`);
      return;
    }

    console.log(`Found ${files.length} files to delete:\n`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    files.forEach((f) => {
      const dateStr = new Date(f.mtime).toISOString().split("T")[0];
      console.log(`${f.name}`);
      console.log(`  Size: ${formatSize(f.size)}`);
      console.log(`  Modified: ${f.daysOld} days ago (${dateStr})\n`);
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Total: ${files.length} files (${formatSize(totalFreed)})\n`);
  });

  cleanup.on("confirm-delete", ({ files, totalFreed }) => {
    console.info(
      `⚠️  DELETING ${files.length} files (${formatSize(totalFreed)}). This action cannot be undone!\n`,
    );
  });

  cleanup.on("file-deleted", ({ current, total }) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`Deleting... ${drawProgressBar(current, total)}`);
  });

  cleanup.on("delete-error", ({ file, error }) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    console.error(`Failed to delete ${file}: ${error.message}\n`);
  });

  cleanup.on("cleanup-complete", ({ deletedCount, actuallyFreed, dryMode }) => {
    if (dryMode) {
      console.log(`\n⚠️  DRY RUN MODE: No files were deleted.`);
      console.log(`To actually delete these files, run with --confirm flag.\n`);
      return;
    }
    console.log(`\n\n✅ Cleanup complete!`);
    console.log(
      `Deleted: ${deletedCount} files (${formatSize(actuallyFreed)} freed)\n`,
    );
  });

  await cleanup.cleanup(directory, options.olderThan, !options.confirm);
}
