import fs from "node:fs";
import path from "node:path";
import { ContractRegistry } from "./contract-registry";
import { getAllKnownTemplateVariables } from "./template-variables";
import { dbgLog } from "./debug-logging";

/**
 * Utility to scan contract templates and extract variables
 */
export class TemplateScanner {
  /**
   * Scan all contract templates and generate a report of variables used
   */
  static async scanAllTemplates(): Promise<Record<string, string[]>> {
    const registry = new ContractRegistry();
    registry.registerAllDefinedContracts();

    const allContracts = registry.getAllContracts();
    const report: Record<string, string[]> = {};

    for (const contract of allContracts) {
      try {
        const templatePath = path.join(
          process.cwd(),
          "contracts",
          contract.templatePath
        );

        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, "utf8");

          // Only check for /g/ format
          const variableRegex = /;;\s*\/g\/([^\/]+)\/([^\/]+)/g;

          const matches = [...templateContent.matchAll(variableRegex)];
          // Only store the key/value pairs, not the surrounding content
          const variables = matches.map((match) => `${match[1]}/${match[2]}`);

          // Store unique variables
          report[`${contract.type}/${contract.name}`] = [...new Set(variables)];
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

    return report;
  }

  /**
   * Generate a consolidated list of all variables used across templates
   */
  static async getAllUniqueVariables(): Promise<string[]> {
    const report = await this.scanAllTemplates();
    const allVariables = Object.values(report).flat();
    return [...new Set(allVariables)];
  }

  /**
   * Get a list of all known template variables
   */
  static getKnownTemplateVariables(): string[] {
    return getAllKnownTemplateVariables();
  }

  /**
   * Find template variables that are used but not in our known list
   */
  static async findUnknownTemplateVariables(): Promise<string[]> {
    const usedVariables = await this.getAllUniqueVariables();
    const knownVariables = this.getKnownTemplateVariables();

    return usedVariables.filter(
      (variable) => !knownVariables.includes(variable)
    );
  }

  /**
   * Save the template variable report to a file
   */
  static async saveVariableReport(outputPath: string): Promise<void> {
    const report = await this.scanAllTemplates();
    const allVariables = await this.getAllUniqueVariables();
    const knownVariables = this.getKnownTemplateVariables();
    const unknownVariables = await this.findUnknownTemplateVariables();

    const output = {
      summary: {
        totalContracts: Object.keys(report).length,
        totalUniqueVariables: allVariables.length,
        knownVariables: knownVariables.length,
        unknownVariables: unknownVariables.length,
      },
      allUniqueVariables: allVariables,
      knownVariables: knownVariables,
      unknownVariables: unknownVariables,
      contractVariables: report,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    dbgLog(`Template variable report saved to ${outputPath}`);
  }
}
