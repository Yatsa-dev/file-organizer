import { EventEmitter } from "node:events";
import fs from "node:fs/promises";
import path from "node:path";

export class Scanner extends EventEmitter {
  async scan(directory) {
    this.emit("scan-start", { directory });

    const stats = {
      totalFiles: 0,
      totalSize: 0,
      byType: new Map(), // Map<ext, {count: number, totalSize: number}>
      byAge: {
        last7Days: 0,
        last30Days: 0,
        olderThan90: 0,
      },
      largestFiles: [], // array of { name: string, path: string, size: number }
      oldestFile: null, // { name: string, path: string, mtime: number, daysOld: number }
    };

    let files = [];
    try {
      files = await fs.readdir(directory, { recursive: true });
    } catch (error) {
      this.emit("error", error, directory);
      return;
    }

    const now = Date.now();

    for (const [index, file] of files.entries()) {
      const fullPath = path.join(directory, file);
      let fileStats;
      try {
        fileStats = await fs.stat(fullPath);
      } catch (err) {
        continue;
      }

      this.emit("progress", { total: files.length, current: index + 1 });

      if (!fileStats.isFile()) continue;

      stats.totalFiles++;
      stats.totalSize += fileStats.size;

      this.emit("file-found", { path: fullPath, size: fileStats.size });

      // Group by extension
      const ext = path.extname(file).toLowerCase() || "(other)";
      const typeStats = stats.byType.get(ext) || { count: 0, totalSize: 0 };
      typeStats.count++;
      typeStats.totalSize += fileStats.size;
      stats.byType.set(ext, typeStats);

      // Age calculation
      const fileAge = now - fileStats.mtime.getTime();
      const daysOld = fileAge / (1000 * 60 * 60 * 24);

      if (daysOld <= 7) stats.byAge.last7Days++;
      else if (daysOld <= 30) stats.byAge.last30Days++;
      else if (daysOld > 90) stats.byAge.olderThan90++;

      // Top 3 largest
      stats.largestFiles.push({
        name: path.basename(file),
        path: fullPath,
        size: fileStats.size,
      });
      stats.largestFiles.sort((a, b) => b.size - a.size);
      if (stats.largestFiles.length > 3) stats.largestFiles.pop();

      // Oldest file
      if (
        !stats.oldestFile ||
        fileStats.mtime.getTime() < stats.oldestFile.mtime
      ) {
        stats.oldestFile = {
          name: path.basename(file),
          path: fullPath,
          mtime: fileStats.mtime.getTime(),
          daysOld: Math.floor(daysOld),
        };
      }
    }

    this.emit("scan-complete", stats);
  }
}
