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
    const commentMatch = currentLine.match(/;;\s*\/g\/([^\/]+)\/([^\/]+)/);
    if (commentMatch) {
      // Find the target line - it's the next non-replacement-comment line
      let targetLineIndex = i + 1;
      while (targetLineIndex < lines.length && 
             lines[targetLineIndex].trim().match(/^;;\s*\/g\//)) {
        targetLineIndex++;
      }
      
      // If we found a valid target line
      if (targetLineIndex < lines.length) {
        const replacementKey = commentMatch[1];
        const valueKey = commentMatch[2];
        const replacementMapKey = `${replacementKey}/${valueKey}`;
        
        if (replacements.has(replacementMapKey)) {
          // Mark this comment line to be skipped
          skipLines.add(i);
          
          // Apply the replacement to the target line
          const originalLine = lines[targetLineIndex];
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
    }
  }
  
  // Second pass: build the output, skipping marked lines
  for (let i = 0; i < lines.length; i++) {
    if (!skipLines.has(i)) {
      processedLines.push(lines[i]);
    }
  }
  
  return processedLines.join("\n");
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
