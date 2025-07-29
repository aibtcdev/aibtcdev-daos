import fs from "fs";
import path from "path";

// Helper to sanitize the report name into a filename
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove special characters
    .replace(/\s+/g, "-"); // replace spaces with hyphens
}

// Get report name from command line arguments
const reportName = process.argv[2];
if (!reportName) {
  console.error("Please provide a name for the cost report.");
  console.error('Usage: npm run save:costs -- "Your Report Name"');
  process.exit(1);
}

// Generate YYYYMMDD date string
const today = new Date();
const year = today.getFullYear();
const month = (today.getMonth() + 1).toString().padStart(2, "0");
const day = today.getDate().toString().padStart(2, "0");
const datePrefix = `${year}${month}${day}`;

// Create the new filename
const sanitizedName = sanitizeFilename(reportName);
const newFilename = `${datePrefix}-${sanitizedName}.json`;

// Define paths
const rootDir = process.cwd();
const costsDir = path.join(rootDir, "costs");
const manifestPath = path.join(costsDir, "costs-manifest.json");
const sourcePath = path.join(rootDir, "costs-reports.json");
const destinationPath = path.join(costsDir, newFilename);

try {
  // 1. Ensure the /costs directory exists
  if (!fs.existsSync(costsDir)) {
    fs.mkdirSync(costsDir, { recursive: true });
    console.log("Created /costs directory.");
  }

  // 2. Read the source costs-reports.json
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }
  const costsData = fs.readFileSync(sourcePath, "utf8");

  // 3. Write the new report file
  fs.writeFileSync(destinationPath, costsData);
  console.log(`Successfully saved cost report to: ${destinationPath}`);

  // 4. Read or initialize the manifest
  let manifest: { name: string; path: string }[] = [];
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch (e) {
      console.warn("Could not parse manifest file. Starting a new one.");
      manifest = [];
    }
  }

  // 5. Add the new report to the manifest
  const newEntry = {
    name: reportName,
    path: `/costs/${newFilename}`,
  };
  manifest.push(newEntry);

  // 6. Write the updated manifest back
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log("Successfully updated costs-manifest.json.");
} catch (error) {
  console.error("An error occurred:", error);
  process.exit(1);
}
