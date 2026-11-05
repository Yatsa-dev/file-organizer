import { EventEmitter } from "node:events";
import fsPromises from "node:fs/promises";
import path from "node:path";

const DAY_MS = 1000 * 60 * 60 * 24;

export class Cleanup extends EventEmitter {
  async cleanup(directory, thresholdDays, dryMode) {
    this.emit("cleanup-start", { directory, thresholdDays, dryMode });

    let files = [];
    try {
      files = await fsPromises.readdir(directory, { recursive: true });
    } catch (error) {
      this.emit("error", error, directory);
      return;
    }

    const now = Date.now();
    const filesToDelete = [];
    let totalFreed = 0;

    for (const file of files) {
      const fullPath = path.join(directory, file);
      let stats;
      try {
        stats = await fsPromises.stat(fullPath);
      } catch (err) {
        continue;
      }

      if (!stats.isFile()) continue;

      const fileAge = now - stats.mtime.getTime();
      const daysOld = fileAge / DAY_MS;

      if (daysOld > thresholdDays) {
        filesToDelete.push({
          name: path.basename(file),
          path: fullPath,
          size: stats.size,
          mtime: stats.mtime,
          daysOld: Math.floor(daysOld),
        });
        totalFreed += stats.size;
        this.emit("file-found", filesToDelete[filesToDelete.length - 1]);
      }
    }

    this.emit("finish-analize", { files: filesToDelete, totalFreed });

    if (filesToDelete.length === 0) return;

    if (dryMode) {
      this.emit("cleanup-complete", { dryMode });
      return;
    }

    let deletedCount = 0;
    let actuallyFreed = 0;

    this.emit("confirm-delete", { files: filesToDelete, totalFreed });

    for (const file of filesToDelete) {
      try {
        await fsPromises.unlink(file.path);
        deletedCount++;
        actuallyFreed += file.size;
        this.emit("file-deleted", {
          current: deletedCount,
          total: filesToDelete.length,
          file: file.name,
        });
      } catch (err) {
        this.emit("delete-error", { file: file.name, error: err });
      }
    }

    this.emit("cleanup-complete", { deletedCount, actuallyFreed });
  }
}
