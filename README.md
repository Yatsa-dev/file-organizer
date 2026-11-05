# File Organizer

Command Line Interface (CLI) tool to organize, analyze, and clean up files.

## Project Structure

The project is structured into commands for easy management of file operations:

- `file-organizer.js`: The main executable file that sets up the CLI using the `commander` library.
- `commands/`: Contains the UI logic for each individual command (`scan.js`, `duplicates.js`, `organize.js`, `cleanup.js`).
- `lib/`: Contains the logic for each individual command (`scanner.js`, `duplicate-finder.js`, `organizer.js`, `cleanup.js`, `utils.js`).
- `package.json`: Contains project metadata and npm scripts.

## Installation Instructions

1. Ensure you have Node.js installed on your system.
2. Clone or download the project.
3. Install dependencies by running the following in your terminal:

   Using npm:

   ```bash
   npm install
   ```

   Using yarn:

   ```bash
   yarn install
   ```

## Basic Run Examples

You can use the commands via package manager scripts as defined in `package.json`:

Using npm (remember to use `--` to pass arguments to the script):

```bash
npm run scan -- /path/to/directory
npm run duplicates -- /path/to/directory
npm run organize -- /path/to/source -o /path/to/target_folder
npm run cleanup -- /path/to/directory -o 30 -c
```

Using yarn:

```bash
yarn scan /path/to/directory
yarn duplicates /path/to/directory
yarn organize /path/to/source -o /path/to/target_folder
yarn cleanup /path/to/directory -o 30 -c
```

Alternatively, you can run the main script directly using Node:

```bash
node file-organizer.js <command> [options]
```

## Detailed Command Examples

### `scan`

Scans the specified directory and outputs statistics (e.g., number of files by type, total size, etc.).

**Arguments:**

- `<directory>`: The path to the directory you want to scan.

**Example:**

```bash
node file-organizer.js scan ./downloads
```

_This command will scan the `./downloads` folder and print out statistics regarding the files it contains._

### `duplicates`

Searches for duplicate files within the specified directory.

**Arguments:**

- `<directory>`: The path to the directory where you want to search for duplicates.

**Example:**

```bash
node file-organizer.js duplicates ./documents
```

_This command will check the `./documents` folder to find files with identical content (duplicates)._

### `organize`

Organizes files from a source directory by distributing them into categories in a target directory.

**Arguments:**

- `<source>`: The path to the source directory containing unorganized files.

- `-o, --output <target>`: (Required) The target directory where the organized files will be moved (or copied).

**Example:**

```bash
node file-organizer.js organize ./documents --output ./organized_documents
```

_This command will organize files from `./documents` and copy them into appropriate category folders inside `./organized_documents`._

### `cleanup`

Finds and optionally deletes files that are older than a specified number of days.

**Arguments:**

- `<directory>`: The path to the directory you want to clean up.

**Options:**

- `-o, --older-than <days>`: Specifies the age threshold in days. Files older than this number will be flagged for cleanup. Default value: `90` days.
- `-c, --confirm`: If provided, the command will actually delete the old files. Without this option, the command runs in "dry-run" mode, showing only what _would_ be deleted without making any changes.

**Examples:**

```bash
# Dry run: check which files are older than 90 days (default)
node file-organizer.js cleanup ./documents

# Find files older than 30 days (without deleting)
node file-organizer.js cleanup ./documents --older-than 30

# Actually delete files older than 30 days
node file-organizer.js cleanup ./documents --older-than 30 --confirm
```
