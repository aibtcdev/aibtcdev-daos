import { dbgLog } from "./debug-logging";
import fs from "node:fs";
import path from "node:path";

/**
 * Processes a contract template line by line and performs replacements
 * when specially formatted strings are encountered
 *
 * Format: ;; /g/KEY/value
 * The line following this comment will have KEY replaced with the value from the replacements map
 * The comment line itself will be stripped from the output
 * 
 * Multiple comment lines can stack on top of a single target line
 */
export function processContractTemplate(
  templateContent: string,
  replacements: Map<string, string>
): string {
  // First handle the special comment-based replacements
  const lines = templateContent.split("\n");
  const processedLines: string[] = [];
  const skipLines = new Set<number>();
  
  // First pass: identify all replacement patterns
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    
    // Check if the current line is a replacement comment
    if (currentLine.trim().startsWith(";;") && currentLine.includes("/g/")) {
      // Find the target line - it's the next non-replacement-comment line
      let targetLineIndex = i + 1;
      while (targetLineIndex < lines.length && 
             lines[targetLineIndex].trim().startsWith(";;") && 
             lines[targetLineIndex].includes("/g/")) {
        targetLineIndex++;
      }
      
      // If we found a valid target line
      if (targetLineIndex < lines.length) {
        // Extract the replacement pattern
        const matches = Array.from(currentLine.matchAll(/;;\s*\/g\/([^\/]+)\/([^\/]+)/g));
        let hasValidReplacement = false;
        
        // Apply each replacement to the target line
        for (const match of matches) {
          const replacementKey = match[1];
          const valueKey = match[2];
          const replacementMapKey = `${replacementKey}/${valueKey}`;
          
          if (replacements.has(replacementMapKey)) {
            hasValidReplacement = true;
            const originalLine = lines[targetLineIndex];
            // Apply the replacement to the target line
            lines[targetLineIndex] = lines[targetLineIndex].replace(
              new RegExp(escapeRegExp(replacementKey), 'g'),
              replacements.get(replacementMapKey)!
            );
            
            // Debug log the replacement
            dbgLog(
              {
                action: "template_replacement",
                key: replacementMapKey,
                originalLine: originalLine,
                replacedLine: lines[targetLineIndex],
              },
              { titleBefore: "Template Replacement" }
            );
          }
        }
        
        // Only skip the comment line if we had a valid replacement
        if (hasValidReplacement) {
          skipLines.add(i);
        }
      }
    }
  }
  
  // Second pass: build the output, skipping marked lines
  for (let i = 0; i < lines.length; i++) {
    if (!skipLines.has(i)) {
      processedLines.push(lines[i]);
    }
  }
  
  let processed = processedLines.join("\n");
  
  // Now handle the {{variable}} replacements
  // Process multiple times to handle nested variables
  let iterations = 0;
  const maxIterations = 5; // Prevent infinite loops
  
  let madeReplacement = true;
  while (madeReplacement && iterations < maxIterations) {
    madeReplacement = false;
    iterations++;
    
    for (const [key, value] of replacements.entries()) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      if (pattern.test(processed)) {
        processed = processed.replace(pattern, value);
        madeReplacement = true;
      }
    }
  }
  
  return processed;
}

/**
 * Helper function to create a replacements map from key-value pairs
 */
export function createReplacementsMap(
  replacements: Record<string, string>
): Map<string, string> {
  return new Map(Object.entries(replacements));
}

/**
 * Helper function to escape special characters in a string for use in a regular expression
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Helper function to get template content from the contracts directory
 */
export async function getContractTemplateContent(
  contract: any
): Promise<string | null> {
  try {
    // Construct the path to the contract file
    const contractPath = path.join(process.cwd(), "contracts", contract.templatePath);
    console.log(`Looking for template at: ${contractPath}`);
    
    // Check if file exists
    if (!fs.existsSync(contractPath)) {
      console.error(`Template file not found: ${contractPath}`);
      return null;
    }
    
    // Read the file content
    const content = await fs.promises.readFile(contractPath, "utf-8");
    return content;
  } catch (error) {
    console.error(
      `Error reading contract template: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return null;
  }
}
