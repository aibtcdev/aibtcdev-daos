import { ContractBase } from "../../models/contract-template";
import { getContractTemplateContent } from "../../utilities/template-processor";
import {
  processContractTemplate,
  createReplacementsMap,
} from "../../utilities/template-processor";
import fs from "node:fs";
import path from "node:path";

export class ContractGeneratorService {
  /**
   * Generate a contract from a template
   */
  async generateContract(
    contract: ContractBase,
    replacements: Record<string, string>
  ): Promise<string> {
    // Get the template content
    const templateContent = await getContractTemplateContent(contract);

    // Check if the template content is empty
    if (!templateContent) {
      console.error(`Template content for ${contract.name} is empty or not found`);
      console.error(`Template path: ${contract.templatePath}`);
      
      // Check if the template file exists
      const templatePath = path.join(process.cwd(), "contracts", contract.templatePath);
      if (!fs.existsSync(templatePath)) {
        console.error(`Template file does not exist: ${templatePath}`);
      }
      
      throw new Error(`Template content for ${contract.name} is empty or not found`);
    }

    // Process the template with replacements
    const replacementsMap = createReplacementsMap(replacements);
    
    // Extract all variables from template to check for missing replacements
    // Only check for /g/KEY/value format
    const variableRegex = /;;\s*\/g\/([^\/]+)\/([^\/]+)/g;
    
    const matches = [...templateContent.matchAll(variableRegex)];
    const variables = matches.map(match => `${match[1]}/${match[2]}`);
    
    const uniqueVars = [...new Set(variables)];
    
    // Check for missing variables
    const missingVars = uniqueVars.filter(v => !replacements[v]);
    if (missingVars.length > 0) {
      console.warn(`Warning: Missing replacements in ${contract.name}:`);
      for (const missingVar of missingVars) {
        const [toReplace, keyName] = missingVar.split('/');
        console.warn(`Not found\nTo replace: ${toReplace}\nWith key: ${keyName}`);
      }
    }
    
    return processContractTemplate(templateContent, replacementsMap);
  }
}
