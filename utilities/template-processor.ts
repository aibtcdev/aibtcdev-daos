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
  const lines = templateContent.split("\n");
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];

    // Check if the current line contains the special format indicator: ;; /g/KEY/value
    const match = currentLine.match(/;;\s*\/g\/([^\/]+)\/([^\/]+)/);
    if (match && i < lines.length - 1) {
      const [_, replacementKey, valueKey] = match;
      const nextLine = lines[i + 1];

      const replacementMapKey = `${replacementKey}/${valueKey}`;
      if (replacements.has(replacementMapKey)) {
        const originalLine = nextLine;
        const replacedLine = nextLine.replace(
          replacementKey,
          replacements.get(replacementMapKey)!
        );

        // Skip adding the comment line to processed lines (strip it out)

        // Add the replaced line
        processedLines.push(replacedLine);

        // Debug log the replacement
        dbgLog(
          {
            action: "template_replacement",
            key: replacementMapKey,
            originalLine,
            replacedLine,
          },
          { titleBefore: "Template Replacement" }
        );

        i++; // Skip the next line since we've processed it
      } else {
        // If no replacement found, keep the original line
        processedLines.push(currentLine);
      }
    } else {
      // No special format, keep the line as is
      processedLines.push(currentLine);
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
