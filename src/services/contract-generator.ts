import { ContractBase } from "../../models/contract-template";
import { dbgLog } from "../../utilities/debug-logging";
import { getContractTemplateContent } from "../../utilities/template-processor";
import {
  processContractTemplate,
  createReplacementsMap,
} from "../../utilities/template-processor";
import { generateTemplateReplacements } from "../../utilities/template-variables";
import { StacksNetworkName } from "@stacks/network";
import { CloudflareBindings } from "../cf-types";
import fs from "node:fs";
import path from "node:path";

export class ContractGeneratorService {
  /**
   * Generate a contract from a template
   */
  async generateContract(
    contract: ContractBase,
    replacements: Record<string, string>,
    env?: CloudflareBindings
  ): Promise<string> {
    try {
      // Get the template content
      const templateContent = await getContractTemplateContent(contract, env);

      // Check if the template content is empty
      if (!templateContent) {
        dbgLog(
          `Template content for ${contract.name} is empty or not found`,
          { logType: "error", titleBefore: "Template Error" }
        );
        dbgLog(`Template path: ${contract.templatePath}`, { logType: "error" });

        // Check if the template file exists
        const templatePath = path.join(
          process.cwd(),
          "contracts",
          contract.templatePath
        );
        if (!fs.existsSync(templatePath)) {
          dbgLog(`Template file does not exist: ${templatePath}`, { logType: "error" });
        }

        throw new Error(
          `Template content for ${contract.name} is empty or not found`
        );
      }

      // Process the template with replacements
      const replacementsMap = createReplacementsMap(replacements);

      // Extract all variables from template to check for missing replacements
      // Only check for /g/KEY/value format
      const variableRegex = /;;\s*\/g\/([^\/]+)\/([^\/]+)/g;

      const matches = [...templateContent.matchAll(variableRegex)];

      // Store variables with their line numbers
      const variablesWithLineNumbers = matches.map((match) => {
        // Calculate line number by counting newlines before the match index
        const lineNumber = templateContent
          .substring(0, match.index || 0)
          .split("\n").length;
        const toReplace = match[1];
        const keyName = match[2].split("\n")[0];
        dbgLog(
          `Found ${toReplace} to replace with ${keyName} at line ${lineNumber}`
        );
        return {
          key: keyName, // Use just the value key as the lookup key
          line: lineNumber,
          toReplace: match[1],
          keyName: match[2],
        };
      });

      // Add combined keys to the replacements map
      // This helps with the format /g/KEY/value where we might have both KEY/value and value in the replacements
      variablesWithLineNumbers.forEach(v => {
        const combinedKey = `${v.toReplace}/${v.key}`;
        if (replacements[v.key] && !replacementsMap.has(combinedKey)) {
          replacementsMap.set(combinedKey, replacements[v.key]);
        }
      });

      // Get unique variables (keeping the first occurrence for line number)
      const uniqueVarsMap = new Map();
      variablesWithLineNumbers.forEach((v) => {
        if (!uniqueVarsMap.has(v.key)) {
          uniqueVarsMap.set(v.key, v);
        }
      });

      const uniqueVars = Array.from(uniqueVarsMap.values());

      // Check for missing variables but don't throw an error
      const missingVars = uniqueVars.filter((v) => !replacements[v.key]);
      if (missingVars.length > 0) {
        const missingDetails = missingVars
          .map((v) => {
            // Extract just the key name and what it replaces, without including surrounding code
            return `LINE ${v.line} MISSING TEMPLATE VARIABLE\nKey: ${
              v.key
            }\nTo replace: ${v.toReplace}`;
          })
          .join("\n\n");

        dbgLog(`Missing template variables for ${contract.name}:`, { logType: "error", titleBefore: "Template Variables Error" });
        dbgLog(missingDetails, { logType: "error" });
        
        // Instead of throwing, we'll add warning comments to the template
        const warningComments = missingVars.map(v => 
          `\n;; WARNING: Missing template variable at line ${v.line}: ${v.key} to replace ${v.toReplace}`
        ).join('');
        
        // Process with what we have
        return processContractTemplate(templateContent, replacementsMap) + warningComments;
      }

      return processContractTemplate(templateContent, replacementsMap);
    } catch (error) {
      // Log the error but don't throw it
      dbgLog(`Error generating contract ${contract.name}: ${error instanceof Error ? error.message : String(error)}`, 
        { logType: "error", titleBefore: "Contract Generation Error" });
      
      // Return a placeholder with the error message
      return `;;ERROR: Failed to generate contract ${contract.name}\n;;Reason: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Generate a contract from a template using network-specific replacements
   */
  async generateContractForNetwork(
    contract: ContractBase,
    network: StacksNetworkName,
    tokenSymbol: string = "aibtc",
    customReplacements: Record<string, string> = {},
    env?: CloudflareBindings
  ): Promise<string> {
    try {
      // Generate replacements for the specified network
      const networkReplacements = generateTemplateReplacements(
        network,
        tokenSymbol,
        customReplacements
      );

      // Use the existing method to generate the contract
      return this.generateContract(contract, networkReplacements, env);
    } catch (error) {
      // Log the error but don't throw it
      dbgLog(`Error generating contract ${contract.name} for network ${network}: ${error instanceof Error ? error.message : String(error)}`, 
        { logType: "error", titleBefore: "Network Contract Generation Error" });
      
      // Return a placeholder with the error message
      return `;;ERROR: Failed to generate contract ${contract.name} for network ${network}\n;;Reason: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}
