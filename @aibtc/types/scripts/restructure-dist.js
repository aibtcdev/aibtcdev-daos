import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Fix import paths in JavaScript and TypeScript declaration files
function fixImportPaths(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      fixImportPaths(filePath);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.d.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix imports that use "../../../"
      const importRegex = entry.name.endsWith('.js') 
        ? /from\s+["']\.\.\/\.\.\/\.\.\/(.+?)["']/g 
        : /from\s+["']\.\.\/\.\.\/\.\.\/(.+?)["']/g;
      
      content = content.replace(importRegex, (match, importPath) => {
        // For imports from utilities directory
        if (importPath.startsWith('utilities/')) {
          return `from "./utilities/${importPath.substring(10)}"`;
        }
        // For imports from models directory
        else if (importPath.startsWith('models/')) {
          return `from "./models/${importPath.substring(7)}"`;
        }
        // For imports from src directory
        else if (importPath.startsWith('src/')) {
          return `from "./src/${importPath.substring(4)}"`;
        }
        // For other imports
        else {
          return `from "./${importPath}"`;
        }
      });
      
      // Also fix type imports in .d.ts files
      if (entry.name.endsWith('.d.ts')) {
        content = content.replace(/import\s+type\s+\{(.+?)\}\s+from\s+["']\.\.\/\.\.\/\.\.\/(.+?)["']/g, (match, types, importPath) => {
          // For imports from utilities directory
          if (importPath.startsWith('utilities/')) {
            return `import type {${types}} from "./utilities/${importPath.substring(10)}"`;
          }
          // For imports from models directory
          else if (importPath.startsWith('models/')) {
            return `import type {${types}} from "./models/${importPath.substring(7)}"`;
          }
          // For imports from src directory
          else if (importPath.startsWith('src/')) {
            return `import type {${types}} from "./src/${importPath.substring(4)}"`;
          }
          // For other imports
          else {
            return `import type {${types}} from "./${importPath}"`;
          }
        });
      }
      
      fs.writeFileSync(filePath, content);
    }
  }
}

// Only proceed if the source directory exists
if (fs.existsSync(sourceDir)) {
  console.log("Copying files back to root of dist");
  console.log("- from: ", sourceDir);
  console.log("- to: ", targetDir);
  copyFiles(sourceDir, targetDir);

  console.log("Fixing import paths in JavaScript files");
  fixImportPaths(targetDir);

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
