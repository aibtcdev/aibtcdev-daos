import fs from "node:fs";
import path from "node:path";
import { ContractRegistry } from "./contract-registry";

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
        const templatePath = path.join(process.cwd(), "contracts", contract.templatePath);
        
        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, "utf8");
          const variableRegex = /\{\{([^}]+)\}\}/g;
          const matches = [...templateContent.matchAll(variableRegex)];
          const variables = matches.map(match => match[1]);
          
          // Store unique variables
          report[`${contract.type}/${contract.name}`] = [...new Set(variables)];
        } else {
          console.error(`Template not found for ${contract.name}: ${templatePath}`);
        }
      } catch (error) {
        console.error(`Error scanning template for ${contract.name}:`, error);
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
   * Save the template variable report to a file
   */
  static async saveVariableReport(outputPath: string): Promise<void> {
    const report = await this.scanAllTemplates();
    const allVariables = await this.getAllUniqueVariables();
    
    const output = {
      allUniqueVariables: allVariables,
      contractVariables: report
    };
    
    fs.writeFileSync(
      outputPath, 
      JSON.stringify(output, null, 2)
    );
    
    console.log(`Template variable report saved to ${outputPath}`);
  }
}
