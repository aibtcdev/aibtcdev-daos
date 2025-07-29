import fs from "fs";
import path from "path";

// Helper to generate a display name from a report filename
function generateNameFromPath(filePath: string): string {
  const filename = path.basename(filePath, ".json");
  // remove YYYYMMDD- and optional number like `-1-`
  const namePart = filename.replace(/^\d{8}(-\d+)?-/, "");
  return namePart
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Define paths
const rootDir = process.cwd();
const costsDir = path.join(rootDir, "costs");
const manifestPath = path.join(costsDir, "costs-manifest.json");

try {
  // 1. Read all JSON report files from the costs directory
  const allFiles = fs.readdirSync(costsDir);
  const reportFiles = allFiles.filter(
    (file) => file.endsWith(".json") && file !== "costs-manifest.json"
  );

  // 2. Read the manifest or create it if it doesn't exist
  let manifest: { name: string; path: string }[] = [];
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch (e) {
      console.error("Could not parse manifest file. Please check its format.");
      process.exit(1);
    }
  }

  // 3. Filter manifest to keep only entries with existing files
  const originalCount = manifest.length;
  let cleanedManifest = manifest.filter((entry) => {
    // The path in the manifest is a web path like `/costs/report.json`.
    // We need to convert it to a file system path relative to the project root.
    const reportPath = path.join(rootDir, entry.path.substring(1));
    const exists = fs.existsSync(reportPath);
    if (!exists) {
      console.log(`Removing missing report: ${entry.name} (${entry.path})`);
    }
    return exists;
  });

  const removedCount = originalCount - cleanedManifest.length;

  // 4. Add new reports found in the directory but not in the manifest
  const manifestPaths = new Set(cleanedManifest.map((entry) => entry.path));
  const allFiles = fs.readdirSync(costsDir);
  const reportFiles = allFiles.filter(
    (file) => file.endsWith(".json") && file !== "costs-manifest.json"
  );

  let addedCount = 0;
  for (const reportFile of reportFiles) {
    const reportWebPath = `/costs/${reportFile}`;
    if (!manifestPaths.has(reportWebPath)) {
      const newName = generateNameFromPath(reportFile);
      cleanedManifest.push({
        name: newName,
        path: reportWebPath,
      });
      addedCount++;
      console.log(`Adding new report: ${newName} (${reportWebPath})`);
    }
  }

  // 5. Sort the manifest alphabetically by name for consistency
  cleanedManifest.sort((a, b) => a.name.localeCompare(b.name));

  // 6. Write the cleaned manifest back if changes were made
  if (removedCount > 0 || addedCount > 0) {
    fs.writeFileSync(manifestPath, JSON.stringify(cleanedManifest, null, 2));
    let summary = "Successfully cleaned manifest.";
    if (removedCount > 0) {
      summary += ` Removed ${removedCount} entries.`;
    }
    if (addedCount > 0) {
      summary += ` Added ${addedCount} entries.`;
    }
    console.log(summary);
  } else {
    console.log("Manifest is already clean. No changes made.");
  }
} catch (error) {
  console.error("An error occurred during cleanup:", error);
  process.exit(1);
}
