import { EventEmitter } from "node:events";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";

const CATEGORIES = {
  Documents: [".pdf", ".docx", ".doc", ".txt", ".md", ".xlsx", ".pptx"],
  Images: [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".bmp"],
  Archives: [".zip", ".rar", ".tar", ".gz", ".7z"],
  Code: [".js", ".py", ".java", ".cpp", ".html", ".css", ".json"],
  Videos: [".mp4", ".avi", ".mkv", ".mov", ".webm"],
  Other: [],
};

const FILE_COPY_METHOD_THRESHOLD = 10 * 1024 * 1024;

function createCategoriesHash(categories) {
  const result = new Map();
  for (const [category, exts] of Object.entries(categories)) {
    exts.forEach((ext) => {
      result.set(ext, category);
    });
  }
  return result;
}

const categoriesHash = createCategoriesHash(CATEGORIES);

function getCategory(extension) {
  const ext = extension.toLowerCase();
  const category = categoriesHash.get(ext);
  return category || "Other";
}

async function getUniquePath(targetDir, originalName) {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);

  let currentName = originalName;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    try {
      await fsPromises.access(path.join(targetDir, currentName));
      currentName = `${base}(${counter})${ext}`;
      counter++;
    } catch (err) {
      if (err.code === "ENOENT") {
        isUnique = true;
      } else {
        throw err;
      }
    }
  }

  return path.join(targetDir, currentName);
}

export class Organizer extends EventEmitter {
  async organize(sourceDir, targetDir) {
    this.emit("organize-start", { sourceDir, targetDir });

    let files = [];
    try {
      files = await fsPromises.readdir(sourceDir, { recursive: true });
    } catch (error) {
      this.emit("error", error, sourceDir);
      return;
    }

    const summary = {
      categories: {}, // {[category]: count}
      totalCopied: 0,
      totalSize: 0,
    };

    try {
      for (const category of Object.keys(CATEGORIES)) {
        await fsPromises.mkdir(path.join(targetDir, category), {
          recursive: true,
        });
        summary.categories[category] = 0;
      }
      this.emit("categories-created", Object.keys(summary.categories));
    } catch (error) {
      this.emit("error", error, targetDir);
      return;
    }

    const fileStatsList = [];
    for (const file of files) {
      const fullPath = path.join(sourceDir, file);
      try {
        const stats = await fsPromises.stat(fullPath);
        if (stats.isFile()) {
          fileStatsList.push({
            path: fullPath,
            stats,
            originalName: path.basename(file),
          });
        }
      } catch (e) {
        // ignore
      }
    }

    const totalFiles = fileStatsList.length;

    for (const [index, fileInfo] of fileStatsList.entries()) {
      const ext = path.extname(fileInfo.originalName);
      const category = getCategory(ext);
      const catDir = path.join(targetDir, category);

      const targetPath = await getUniquePath(catDir, fileInfo.originalName);

      this.emit("copy-start", {
        file: fileInfo.originalName,
        target: targetPath,
        current: index + 1,
        total: totalFiles,
      });

      try {
        if (fileInfo.stats.size < FILE_COPY_METHOD_THRESHOLD) {
          await fsPromises.copyFile(fileInfo.path, targetPath);
        } else {
          await pipeline(
            fs.createReadStream(fileInfo.path),
            fs.createWriteStream(targetPath),
          );
        }

        summary.categories[category]++;
        summary.totalCopied++;
        summary.totalSize += fileInfo.stats.size;

      this.emit("copy-complete", {
        file: fileInfo.originalName,
        target: targetPath,
        current: index + 1,
        total: totalFiles,
      });
      } catch (err) {
        this.emit("copy-error", {
          file: fileInfo.originalName,
          target: targetPath,
          error: err,
        });
      }
    }

    this.emit("organize-complete", summary);
  }
}
