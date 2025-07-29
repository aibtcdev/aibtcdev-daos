import fs from "fs";
import path from "path";

// Define paths
const rootDir = process.cwd();
const costsDir = path.join(rootDir, "costs");
const manifestPath = path.join(costsDir, "costs-manifest.json");

try {
  // 1. Check if manifest exists
  if (!fs.existsSync(manifestPath)) {
    console.log("Manifest file not found. Nothing to clean.");
    process.exit(0);
  }

  // 2. Read the manifest
  let manifest: { name: string; path: string }[] = [];
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (e) {
    console.error("Could not parse manifest file. Please check its format.");
    process.exit(1);
  }

  if (manifest.length === 0) {
    console.log("Manifest is empty. Nothing to clean.");
    process.exit(0);
  }

  // 3. Filter manifest to keep only entries with existing files
  const originalCount = manifest.length;
  const cleanedManifest = manifest.filter((entry) => {
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

  // 4. Write the cleaned manifest back if changes were made
  if (removedCount > 0) {
    fs.writeFileSync(manifestPath, JSON.stringify(cleanedManifest, null, 2));
    console.log(
      `Successfully cleaned manifest. Removed ${removedCount} entries.`
    );
  } else {
    console.log("Manifest is already clean. No changes made.");
  }
} catch (error) {
  console.error("An error occurred during cleanup:", error);
  process.exit(1);
}
