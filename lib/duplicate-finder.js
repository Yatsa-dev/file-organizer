import { EventEmitter } from "node:events";
import crypto from "node:crypto";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

function calculateHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

export class DuplicateFinder extends EventEmitter {
  async findDuplicates(directory) {
    this.emit("duplicates-start", { directory });

    let files = [];
    try {
      files = await fsPromises.readdir(directory, { recursive: true });
    } catch (error) {
      this.emit("error", error, directory);
      return;
    }

    const hashes = new Map(); // Map<hash, { filePaths: string[]; size: number }>

    for (const [index, file] of files.entries()) {
      const fullPath = path.join(directory, file);
      let stats;
      try {
        stats = await fsPromises.stat(fullPath);
      } catch (e) {
        continue;
      }

      this.emit("progress", { total: files.length, current: index + 1 });

      if (stats.isFile()) {
        try {
          const hash = await calculateHash(fullPath);
          this.emit("file-processed", {
            path: fullPath,
            hash,
          });

          const group = hashes.get(hash) || { filePaths: [], size: stats.size };
          group.filePaths.push(fullPath);
          hashes.set(hash, group);
        } catch (err) {
          // skip read error
        }
      }
    }

    let wastedSpace = 0;
    const duplicates = []; // {hash: string; filePaths: string; size: number; waste: number}

    for (const [hash, group] of hashes.entries()) {
      if (group.filePaths.length > 1) {
        const copies = group.filePaths.length;
        const waste = group.size * (copies - 1);
        wastedSpace += waste;
        duplicates.push({
          hash,
          filePaths: group.filePaths,
          size: group.size,
          waste,
        });
      }
    }

    this.emit("duplicates-found", { duplicates, wastedSpace });
  }
}
