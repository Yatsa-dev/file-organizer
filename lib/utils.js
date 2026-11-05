export function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes}  B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

export function drawProgressBar(current, total, width = 20) {
  if (total === 0) return "█".repeat(width) + ` ${current}/${total}`;
  const percentage = current / total;
  const filled = Math.round(percentage * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  return `${bar} ${current}/${total}`;
}

export function showError(err, dir) {
  if (err.code === "ENOENT")
    console.error(`\n❌ Error: Directory not found: ${dir}`);
  else if (err.code === "EACCES")
    console.error(`\n❌ Error: Permission denied: ${dir}`);
  else console.error(`\n❌ Unexpected error: ${err.message}`);
}
