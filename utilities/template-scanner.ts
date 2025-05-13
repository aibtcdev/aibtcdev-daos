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
          
          // Check for both variable formats
          const variableRegex1 = /\{\{([^}]+)\}\}/g;
          const variableRegex2 = /;;\s*\/g\/([^\/]+)\/([^\/]+)/g;
          
          const matches1 = [...templateContent.matchAll(variableRegex1)];
          const matches2 = [...templateContent.matchAll(variableRegex2)];
          
          const variables1 = matches1.map(match => match[1]);
          const variables2 = matches2.map(match => `${match[1]}/${match[2]}`);
          
          // Store unique variables
          report[`${contract.type}/${contract.name}`] = [...new Set([...variables1, ...variables2])];
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
