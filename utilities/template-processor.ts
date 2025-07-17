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

      // Look up the replacement value directly using the valueKey
      const replacementValue = replacements.get(valueKey);

      if (replacementValue === undefined) {
        throw new Error(
          `Template variable '${valueKey}' not found in replacements map for comment at line ${
            i + 1
          }`
        );
      }

      // Find the target line by skipping any subsequent stacked directives.
      let targetLineIndex = i + 1;
      while (
        targetLineIndex < lines.length &&
        lines[targetLineIndex].trim().match(/^;;\s*\/g\//)
      ) {
        targetLineIndex++;
      }

      // Check if the target line exists or if a blank line was found
      if (
        targetLineIndex >= lines.length ||
        lines[targetLineIndex].trim() === ""
      ) {
        throw new Error(
          `Could not find a valid target line for replacement key '${replacementKey}' from comment at line ${
            i + 1
          }.`
        );
      }

      const targetLine = lines[targetLineIndex];

      // If the key is not found in the target line, it's a template error
      if (!targetLine.includes(replacementKey)) {
        throw new Error(
          `Replacement key '${replacementKey}' from comment at line ${
            i + 1
          } not found in target line ${targetLineIndex + 1}: "${targetLine}"`
        );
      }

      // If we found a valid target line
      templateVariables.push({
        lineIndex: targetLineIndex,
        commentLineIndex: i,
        key: replacementKey,
        value: replacementValue!,
        replacementKey: valueKey,
      });

      // Mark this comment line to be skipped
      skipLines.add(i);
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
    dbgLog({
      action: "template_replacement",
      key: variable.replacementKey,
      originalLine,
      replacedLine: lines[variable.lineIndex],
      lineNumber: variable.lineIndex + 1,
    });
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

import { CloudflareBindings } from "../src/cf-types";

/**
 * Helper function to get template content from the contracts directory
 */
export async function getContractTemplateContent(
  contract: any,
  env?: CloudflareBindings
): Promise<string | null> {
  // first try to load from the filesystem (for local development)
  try {
    const localPath = path.join(
      process.cwd(),
      "contracts",
      contract.templatePath
    );
    dbgLog(`Looking for template locally: ${localPath}`);

    // Check if file exists locally
    if (fs.existsSync(localPath)) {
      dbgLog(`Found template locally at: ${localPath}`);
      const content = await fs.promises.readFile(localPath, "utf-8");
      return content;
    }
  } catch (fsError) {
    dbgLog(
      `Error reading local template: ${
        fsError instanceof Error ? fsError.message : String(fsError)
      }`
    );
  }

  // If not found locally, try to fetch from the worker assets
  // In our Cloudflare Worker environment, assets are available at the root /contracts folder

  try {
    if (env && env.AIBTC_ASSETS) {
      // We need to use the current request URL as the base for our asset URLs
      const assetUrl = new URL(
        `/contracts/${contract.templatePath}`,
        "https://assets.local"
      );
      const request = new Request(assetUrl);
      const response = await env.AIBTC_ASSETS.fetch(request);

      if (response.ok) {
        dbgLog(`Found template in assets at: ${assetUrl}`);
        const content = await response.text();
        dbgLog(
          `Fetched template content from assets: ${content.substring(
            0,
            100
          )}...`
        );
        return content;
      }

      // If the response is not OK, throw the error
      throw new Error(
        `Failed to fetch template from assets: ${assetUrl} ${response.status} ${response.statusText}`
      );
    } else {
      dbgLog("AIBTC_ASSETS environment binding is not available");
    }
  } catch (fetchError) {
    dbgLog(
      `Error fetching from assets: ${
        fetchError instanceof Error ? fetchError.message : String(fetchError)
      }`
    );
  }

  // If we get here, the template wasn't found through any method
  dbgLog(`Template file not found: ${contract.templatePath}`, {
    logType: "error",
    forceLog: true,
  });
  return null;
}
