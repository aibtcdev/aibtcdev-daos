import { ContractBase } from "../../models/contract-template";
import { dbgLog } from "../../utilities/debug-logging";
import { getContractTemplateContent } from "../../utilities/template-processor";
import {
  processContractTemplate,
  createReplacementsMap,
} from "../../utilities/template-processor";
import { generateTemplateReplacements } from "../../utilities/template-variables";
import { StacksNetworkName } from "@stacks/network";
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
      console.error(
        `Template content for ${contract.name} is empty or not found`
      );
      console.error(`Template path: ${contract.templatePath}`);

      // Check if the template file exists
      const templatePath = path.join(
        process.cwd(),
        "contracts",
        contract.templatePath
      );
      if (!fs.existsSync(templatePath)) {
        console.error(`Template file does not exist: ${templatePath}`);
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

    // Get unique variables (keeping the first occurrence for line number)
    const uniqueVarsMap = new Map();
    variablesWithLineNumbers.forEach((v) => {
      if (!uniqueVarsMap.has(v.key)) {
        uniqueVarsMap.set(v.key, v);
      }
    });

    const uniqueVars = Array.from(uniqueVarsMap.values());

    // Check for missing variables
    const missingVars = uniqueVars.filter((v) => !replacements[v.key]);
    if (missingVars.length > 0) {
      const missingDetails = missingVars
        .map((v) => {
          // Extract just the key name and what it replaces, without including surrounding code
          return `LINE ${v.line} MISSING TEMPLATE VARIABLE\nExpected key: ${
            v.keyName.split("\n")[0]
          }\nReplaces text: ${v.toReplace}`;
        })
        .join("\n\n");

      console.error(`Missing template variables for ${contract.name}:`);
      console.error(missingDetails);
      throw new Error(
        `Missing template variables for ${contract.name}:\n${missingDetails}`
      );
    }

    return processContractTemplate(templateContent, replacementsMap);
  }

  /**
   * Generate a contract from a template using network-specific replacements
   */
  async generateContractForNetwork(
    contract: ContractBase,
    network: StacksNetworkName,
    tokenSymbol: string = "aibtc",
    customReplacements: Record<string, string> = {}
  ): Promise<string> {
    // Generate replacements for the specified network
    const networkReplacements = generateTemplateReplacements(
      network,
      tokenSymbol,
      customReplacements
    );

    // Use the existing method to generate the contract
    return this.generateContract(contract, networkReplacements);
  }
}
