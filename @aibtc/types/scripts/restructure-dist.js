const fs = require("fs");
const path = require("path");

// Define paths
const sourceDir = path.join(__dirname, "../dist/@aibtc/types/src");
const targetDir = path.join(__dirname, "../dist");

// Make sure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy all files from nested structure to the root of dist
function copyFiles(dir, targetBase) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(dir, entry.name);
    const targetPath = path.join(targetBase, entry.name);

    if (entry.isDirectory()) {
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      copyFiles(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

// Only proceed if the source directory exists
if (fs.existsSync(sourceDir)) {
  console.log("Copying files back to root of dist");
  console.log("- from: ", sourceDir);
  console.log("- to: ", targetDir);
  copyFiles(sourceDir, targetDir);

  // Clean up the original nested structure
  const nestedDir = path.join(__dirname, "../dist/@aibtc");
  if (fs.existsSync(nestedDir)) {
    fs.rmSync(nestedDir, { recursive: true, force: true });
  }

  console.log("Successfully restructured dist folder");
} else {
  console.error("Source directory not found:", sourceDir);
  process.exit(1);
}
