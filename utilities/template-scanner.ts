import fs from "node:fs";
import path from "node:path";
import { ContractRegistry } from "./contract-registry";
import { getAllKnownTemplateVariables } from "./template-variables";
import { dbgLog } from "./debug-logging";
// Import defineAllDaoContractDependencies if it's not already implicitly called
// by registry.registerAllDefinedContracts() or if registry setup needs it explicitly here.
// For this change, we assume the registry setup within scanAllTemplates correctly
// populates contract dependencies.
import { defineAllDaoContractDependencies } from "./contract-dependencies";

export interface ValidationIssue {
  filePath: string; // Relative path to the .clar template
  lineNumber?: number; // Line number of the template comment
  toReplace: string; // The "what to match" part from the comment
  keyName: string; // The "key for replacement" part from the comment
  issueType: "UnknownKeyName" | "UndeclaredDependency";
  message: string;
}

/**
 * Utility to scan contract templates and extract variables
 */
export class TemplateScanner {
  /**
   * Scan all contract templates and generate a report of validation issues.
   */
  static async scanAllTemplates(): Promise<ValidationIssue[]> {
    const registry = new ContractRegistry();
    registry.registerAllDefinedContracts();
    // Ensure dependencies are defined for all registered contracts
    defineAllDaoContractDependencies(registry);

    const allContracts = registry.getAllContracts();
    const issues: ValidationIssue[] = [];
    const knownKeyNames = new Set(getAllKnownTemplateVariables());

    for (const contract of allContracts) {
      try {
        const templatePath = path.join(
          process.cwd(),
          "contracts",
          contract.templatePath
        );

        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, "utf8");
          const lines = templateContent.split("\n");
          const templateVariablesFound: Array<{
            toReplace: string;
            keyName: string;
            lineNumber: number;
          }> = [];

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const commentMatch = line.match(/;;\s*\/g\/([^\/]+)\/([^\/]+)/);
            if (commentMatch) {
              templateVariablesFound.push({
                toReplace: commentMatch[1],
                keyName: commentMatch[2],
                lineNumber: i + 1,
              });
            }
          }

          const declaredKeyNames = new Set<string>();
          contract.requiredAddresses.forEach((dep) =>
            declaredKeyNames.add(dep.key)
          );
          contract.requiredTraits.forEach((dep) =>
            declaredKeyNames.add(dep.key)
          );
          contract.requiredContractAddresses.forEach((dep) =>
            declaredKeyNames.add(dep.key)
          );
          contract.requiredRuntimeValues.forEach((dep) => {
            // dep.key could be "toReplace/keyName" from addTemplateVariable via scanTemplateVariables,
            // or just "keyName" from an explicit addRuntimeValue(keyName) in contract-dependencies.ts
            const parts = dep.key.split("/");
            if (parts.length > 1 && dep.key.includes("/")) {
              // Heuristic for composite key
              declaredKeyNames.add(parts[1]);
            } else {
              declaredKeyNames.add(dep.key);
            }
          });

          for (const foundVar of templateVariablesFound) {
            // Validation 1: Unknown keyName
            if (!knownKeyNames.has(foundVar.keyName)) {
              issues.push({
                filePath: contract.templatePath,
                lineNumber: foundVar.lineNumber,
                toReplace: foundVar.toReplace,
                keyName: foundVar.keyName,
                issueType: "UnknownKeyName",
                message: `The keyName '${foundVar.keyName}' is not defined in template-variables.ts.`,
              });
            }

            // Validation 2: Undeclared Dependency for this specific contract
            // This checks if the keyName found in the template comment is among the keys explicitly declared
            // for this contract type/subtype via contract-dependencies.ts (which populates the required* arrays).
            if (!declaredKeyNames.has(foundVar.keyName)) {
              issues.push({
                filePath: contract.templatePath,
                lineNumber: foundVar.lineNumber,
                toReplace: foundVar.toReplace,
                keyName: foundVar.keyName,
                issueType: "UndeclaredDependency",
                message: `The keyName '${foundVar.keyName}' is used in template '${contract.templatePath}' but not declared as a dependency for contract '${contract.name}'.`,
              });
            }
          }
        } else {
          dbgLog(`Template not found for ${contract.name}: ${templatePath}`, {
            logType: "error",
          });
        }
      } catch (error) {
        dbgLog(
          `Error scanning template for ${contract.name}: ${
            error instanceof Error ? error.message : String(error)
          }`,
          { logType: "error" }
        );
      }
    }
    return issues;
  }

  /**
   * Prints a report of validation issues to the console.
   */
  static printReport(issues: ValidationIssue[]): void {
    if (issues.length === 0) {
      console.log("Template scan complete. No issues found.");
      return;
    }
    console.error(`Template scan found ${issues.length} issue(s):`);
    issues.forEach((issue) => {
      console.error(
        `- ${issue.filePath}${
          issue.lineNumber ? `:${issue.lineNumber}` : ""
        }: [${issue.issueType}] ${issue.message} (Comment: ;; /g/${
          issue.toReplace
        }/${issue.keyName})`
      );
    });
  }

  /**
   * Saves the validation issue report to a JSON file.
   */
  static async saveReportAsJson(
    issues: ValidationIssue[],
    outputPath: string
  ): Promise<void> {
    try {
      fs.writeFileSync(
        path.resolve(outputPath),
        JSON.stringify(issues, null, 2)
      );
      console.log(`Template scan report saved to ${outputPath}`);
    } catch (error) {
      console.error(
        `Failed to save template scan report: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Get a list of all known template variables
   */
  static getKnownTemplateVariables(): string[] {
    return getAllKnownTemplateVariables();
  }

  /**
   * Check if all template variables for a specific contract will be filled
   * @param contractName The name of the contract to check
   * @param replacements The replacements map to check against
   * @returns Object containing validation results
   */
  static validateContractReplacements(
    contractName: string,
    replacements: Record<string, string>
  ): { valid: boolean; missingVariables: string[] } {
    try {
      const registry = new ContractRegistry();
      registry.registerAllDefinedContracts();
      defineAllDaoContractDependencies(registry);

      const contract = registry.getContract(contractName);
      if (!contract) {
        return {
          valid: false,
          missingVariables: [`Contract not found: ${contractName}`],
        };
      }

      const templatePath = path.join(
        process.cwd(),
        "contracts",
        contract.templatePath
      );

      if (!fs.existsSync(templatePath)) {
        return {
          valid: false,
          missingVariables: [`Template not found: ${templatePath}`],
        };
      }

      const templateContent = fs.readFileSync(templatePath, "utf8");
      const variableRegex = /;;\s*\/g\/([^\/]+)\/([^\/]+)/g;
      const matches = [...templateContent.matchAll(variableRegex)];

      const variablesInTemplate = matches.map((match) => ({
        toReplace: match[1],
        keyName: match[2],
      }));

      const missingVariables = variablesInTemplate
        .filter((variable) => {
          // Check if the keyName has a replacement
          return !replacements[variable.keyName];
        })
        .map(
          (variable) =>
            `Missing replacement for keyName: '${variable.keyName}' (from comment ;; /g/${variable.toReplace}/${variable.keyName})`
        );

      return {
        valid: missingVariables.length === 0,
        missingVariables,
      };
    } catch (error) {
      return {
        valid: false,
        missingVariables: [
          `Error: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }
}
