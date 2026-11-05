import { Command } from 'commander';
import { scanAction } from './commands/scan.js';
import { duplicatesAction } from './commands/duplicates.js';
import { organizeAction } from './commands/organize.js';
import { cleanupAction } from './commands/cleanup.js';

const program = new Command();

program
  .name('file-organizer')
  .description('CLI tool to organize files')
  .version('1.0.0');

program
  .command('scan <directory>')
  .description('Scan directory and show statistics')
  .action(scanAction);

program
  .command('duplicates <directory>')
  .description('Search for duplicate files')
  .action(duplicatesAction);

program
  .command("organize <source>")
  .description("Organize files by category")
  .option("-o, --output <target>", "Output directory")
  .action(organizeAction);

program
  .command("cleanup <directory>")
  .description("Find and optionally delete old files")
  .option(
    "-o, --older-than <days>",
    "Specify threshold in days",
    (val) => parseInt(val),
    90,
  )
  .option("-c, --confirm", "Actually delete the files")
  .action(cleanupAction);

program.parse();
