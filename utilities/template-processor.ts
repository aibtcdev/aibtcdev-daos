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
 */
export function processContractTemplate(
  templateContent: string,
  replacements: Map<string, string>
): string {
  // First, identify all the replacement patterns and their target lines
  const lines = templateContent.split("\n");
  const processedLines: string[] = [];
  const skipLines = new Set<number>();

  // First pass: identify all replacement patterns and apply them
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    
    // Check if the current line contains the special format indicator: ;; /g/KEY/value
    if (currentLine.trim().startsWith(";;") && currentLine.includes("/g/") && i < lines.length - 1) {
      const matches = Array.from(currentLine.matchAll(/;;\s*\/g\/([^\/]+)\/([^\/]+)/g));
      
      if (matches.length > 0) {
        // We found at least one replacement pattern
        let nextLine = lines[i + 1];
        let replacementMade = false;

        // Process all matches in the comment line
        for (const match of matches) {
          const replacementKey = match[1];
          const valueKey = match[2];
          const replacementMapKey = `${replacementKey}/${valueKey}`;
          
          if (replacements.has(replacementMapKey)) {
            // Use a global replace to catch all instances of the key in the line
            nextLine = nextLine.replace(
              new RegExp(replacementKey, 'g'),
              replacements.get(replacementMapKey)!
            );
            replacementMade = true;
            
            // Debug log the replacement
            dbgLog(
              {
                action: "template_replacement",
                key: replacementMapKey,
                originalLine: lines[i + 1],
                replacedLine: nextLine,
              },
              { titleBefore: "Template Replacement" }
            );
          }
        }

        if (replacementMade) {
          // Mark the comment line to be skipped
          skipLines.add(i);
          // Update the next line with replacements
          lines[i + 1] = nextLine;
        }
      }
    }
  }

  // Second pass: build the final output, skipping marked comment lines
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
 * Helper function to get template content from the contracts directory
 */
export async function getContractTemplateContent(
  contract: any
): Promise<string | null> {
  try {
    // Construct the path to the contract file
    const contractPath = path.join("contracts", contract.templatePath);
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
