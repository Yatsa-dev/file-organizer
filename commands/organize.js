import { Organizer } from "../lib/organizer.js";
import { drawProgressBar, formatSize, showError } from "../lib/utils.js";

export async function organizeAction(source, options) {
  const organizer = new Organizer();
  const target = options.output;

  organizer.on("organize-start", ({ sourceDir, targetDir }) => {
    console.log(`\n📦 Organizing: ${sourceDir}`);
    console.log(`Target: ${targetDir}\n`);
    console.log("Creating folders...");
  });

  organizer.on("categories-created", (categories) => {
    categories.forEach((cat) => {
      console.log(`  ✓ ${cat}/`);
    });
    console.log("");
  });

  const showProgress = ({ total, current }) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`Copying files... ${drawProgressBar(current, total)}`);
  };

  organizer.on("copy-start", showProgress);
  organizer.on("copy-complete", showProgress);

  organizer.on("copy-error", ({ file, error }) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`Failed to copy ${file}: ${error.message}\n`);
  });

  organizer.on("error", (err, dir) => {
    showError(err, dir);
    process.exit(1);
  });

  organizer.on("organize-complete", (summary) => {
    console.log(`\n\n✅ Organization complete!\n`);
    console.log(`Summary:`);

    const cats = Object.entries(summary.categories).sort(
      ([, valueA], [, valueB]) => valueB - valueA,
    );
    cats.forEach((cat) => {
      console.log(
        `  ${`${cat[0]}:`.padEnd(12)} ${String(cat[1]).padStart(5)} files → ${target}/${cat[0]}/`,
      );
    });

    console.log(
      `\nTotal copied: ${summary.totalCopied} files (${formatSize(summary.totalSize)})\n`,
    );
  });

  await organizer.organize(source, target);
}
