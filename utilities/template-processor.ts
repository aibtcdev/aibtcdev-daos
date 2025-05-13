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
      const replacementMapKey = `${replacementKey}/${valueKey}`;
      
      if (replacements.has(replacementMapKey)) {
        // Find the target line - could be several lines down
        // We need to find the first non-comment line after this comment that contains the key
        let targetLineIndex = i + 1;
        let foundTarget = false;
        
        while (targetLineIndex < lines.length && !foundTarget) {
          // Skip other template variable comments
          if (lines[targetLineIndex].trim().match(/^;;\s*\/g\//)) {
            targetLineIndex++;
            continue;
          }
          
          // Skip empty lines or regular comments that don't contain the key
          if (lines[targetLineIndex].trim() === '' || 
              (lines[targetLineIndex].trim().startsWith(';;') && 
               !lines[targetLineIndex].includes(replacementKey))) {
            targetLineIndex++;
            continue;
          }
          
          // Check if this line contains the key to be replaced
          if (lines[targetLineIndex].includes(replacementKey)) {
            foundTarget = true;
            break;
          }
          
          // If we've gone too far (e.g., 10 lines) without finding the key, stop searching
          if (targetLineIndex > i + 10) {
            break;
          }
          
          targetLineIndex++;
        }
        
        // If we found a valid target line
        if (foundTarget && targetLineIndex < lines.length) {
          templateVariables.push({
            lineIndex: targetLineIndex,
            commentLineIndex: i,
            key: replacementKey,
            value: replacements.get(replacementMapKey)!,
            replacementKey: replacementMapKey
          });
          
          // Mark this comment line to be skipped
          skipLines.add(i);
        } else {
          // Log a warning if we couldn't find the target line
          dbgLog(
            {
              action: "template_replacement_warning",
              key: replacementMapKey,
              message: `Could not find target line containing key '${replacementKey}' for comment at line ${i+1}`,
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
      new RegExp(escapeRegExp(variable.key), 'g'),
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
      { titleBefore: "Template Replacement" }
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
