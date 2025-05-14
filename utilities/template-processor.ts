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

  // Process all template variables
  const templateVariables: {
    lineIndex: number;
    commentLineIndex: number;
    key: string;
    value: string;
    replacementKey: string;
  }[] = [];

  // First pass: identify all replacement patterns and their target lines
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];

    // Check if the current line is a replacement comment
    const commentMatch = currentLine.match(/;;\s*\/g\/([^\/]+)\/([^\/]+)/);
    if (commentMatch) {
      const replacementKey = commentMatch[1];
      const valueKey = commentMatch[2];
      
      // Try both the value key and the combined key for lookup
      const combinedKey = `${replacementKey}/${valueKey}`;
      const replacementValue = replacements.has(valueKey) 
        ? replacements.get(valueKey)
        : replacements.has(combinedKey) 
          ? replacements.get(combinedKey)
          : null;
          
      if (replacementValue !== null) {
        // Find the target line - the first line after this comment that contains the key
        let targetLineIndex = i + 1;
        let foundTarget = false;

        // First, skip any comment lines that might be stacked
        while (
          targetLineIndex < lines.length &&
          (lines[targetLineIndex].trim() === "" ||
            lines[targetLineIndex].trim().match(/^;;\s*\/g\//) ||
            lines[targetLineIndex].trim().startsWith(";;"))
        ) {
          targetLineIndex++;
        }

        // Now look for the first line containing the key
        const searchLimit = Math.min(targetLineIndex + 10, lines.length);
        for (let j = targetLineIndex; j < searchLimit; j++) {
          if (lines[j].includes(replacementKey)) {
            targetLineIndex = j;
            foundTarget = true;
            break;
          }
        }

        // If we found a valid target line
        if (foundTarget && targetLineIndex < lines.length) {
          templateVariables.push({
            lineIndex: targetLineIndex,
            commentLineIndex: i,
            key: replacementKey,
            value: replacementValue!,
            replacementKey: valueKey,
          });

          // Mark this comment line to be skipped
          skipLines.add(i);
        } else {
          // Log a warning if we couldn't find the target line
          dbgLog(
            {
              action: "template_replacement_warning",
              key: valueKey,
              message: `Could not find target line containing key '${replacementKey}' for comment at line ${
                i + 1
              }`,
            },
            { titleBefore: "Template Replacement Warning", forceLog: true }
          );
        }
      }
    }
  }

  // Second pass: apply all replacements
  for (const variable of templateVariables) {
    const originalLine = lines[variable.lineIndex];
    lines[variable.lineIndex] = lines[variable.lineIndex].replace(
      new RegExp(escapeRegExp(variable.key), "g"),
      variable.value
    );

    // Debug log the replacement
    dbgLog(
      {
        action: "template_replacement",
        key: variable.replacementKey,
        originalLine,
        replacedLine: lines[variable.lineIndex],
      },
      { titleBefore: "Template Replacement", forceLog: true }
    );
  }

  // Third pass: build the output, skipping marked lines
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
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/**
 * Helper function to get template content from the contracts directory
 */
export async function getContractTemplateContent(
  contract: any
): Promise<string | null> {
  try {
    // First try to load from the filesystem (for local development)
    const localPath = path.join(
      process.cwd(),
      "contracts",
      contract.templatePath
    );
    dbgLog(`Looking for template locally: ${localPath}`, { forceLog: true });

    // Check if file exists locally
    if (fs.existsSync(localPath)) {
      dbgLog(`Found template locally at: ${localPath}`, { forceLog: true });
      const content = await fs.promises.readFile(localPath, "utf-8");
      return content;
    }

    // If not found locally, try to fetch from the worker assets
    // In a Cloudflare Worker environment, assets are available at the root
    try {
      // We need to use the current request URL as the base for our asset URLs
      const currentUrl = new URL(self.location.href);
      const baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;
      const fullAssetUrl = `${baseUrl}/contracts/${contract.templatePath}`;
      
      dbgLog(`Looking for template in assets: ${fullAssetUrl}`, { forceLog: true });
      
      // Try to fetch the asset directly
      const response = await fetch(fullAssetUrl);
      
      if (response.ok) {
        dbgLog(`Found template in assets at: ${fullAssetUrl}`, { forceLog: true });
        const content = await response.text();
        return content;
      }
    } catch (fetchError) {
      dbgLog(`Error fetching from assets: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`, { forceLog: true });
      // Continue to try other methods if fetch fails
    }

    // If we get here, the template wasn't found
    dbgLog(`Template file not found: ${contract.templatePath}`, { logType: "error", titleBefore: "Template File Error", forceLog: true });
    return null;
  } catch (error) {
    dbgLog(
      `Error reading contract template: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { logType: "error", titleBefore: "Contract Template Error", forceLog: true }
    );
    return null;
  }
}
