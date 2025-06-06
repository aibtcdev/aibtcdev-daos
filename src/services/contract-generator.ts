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
        dbgLog(`Template content for ${contract.name} is empty or not found`, {
          logType: "error",
        });
        dbgLog(`Template path: ${contract.templatePath}`, { logType: "error" });

        // Check if the template file exists
        const templatePath = path.join(
          process.cwd(),
          "contracts",
          contract.templatePath
        );
        if (!fs.existsSync(templatePath)) {
          dbgLog(`Template file does not exist: ${templatePath}`, {
            logType: "error",
          });
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

      // Check for missing variables but don't throw an error
      const missingVars = uniqueVars.filter((v) => !replacements[v.key]);
      if (missingVars.length > 0) {
        // Build a detailed error message with all missing variables
        const missingDetails = missingVars
          .map((v) => {
            return `LINE ${v.line} MISSING TEMPLATE VARIABLE\nKey: ${v.key}\nTo replace: ${v.toReplace}`;
          })
          .join("\n\n");

        dbgLog(`Missing template variables for ${contract.name}:`, {
          logType: "error",
        });
        dbgLog(missingDetails, { logType: "error" });

        // Throw an error with detailed information about missing variables
        throw new Error(
          `Missing template variables for ${contract.name}:\n${missingDetails}`
        );
      }

      return processContractTemplate(templateContent, replacementsMap);
    } catch (error) {
      // Log the error but don't throw it
      dbgLog(
        `Error generating contract ${contract.name}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { logType: "error" }
      );

      // Return a placeholder with the error message
      throw new Error(
        `Failed to generate contract for ${contract.name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
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
    // For agent accounts, validate that we have the required custom replacements
    if (contract.type === "AGENT" && contract.subtype === "AGENT_ACCOUNT") {
      if (!customReplacements["account_owner"]) {
        throw new Error("Missing required replacement: account_owner");
      }
      if (!customReplacements["account_agent"]) {
        throw new Error("Missing required replacement: account_agent");
      }

      // Log the agent account parameters
      dbgLog(
        `Generating agent account with owner: ${customReplacements["account_owner"]} and agent: ${customReplacements["account_agent"]}`,
        {
          logType: "info",
        }
      );
    }
    try {
      // Set the display name by replacing 'aibtc' with the lowercase token symbol
      const displayName = contract.name.replace("aibtc", tokenSymbol);
      contract.setDisplayName(displayName);

      // Escape quotes and other special characters in the DAO mission statement if present
      // Replace 'DAO_MISSION_STATEMENT' with the actual key used for the mission string
      const missionKey = "DAO_MISSION_STATEMENT"; 
      if (customReplacements && typeof customReplacements[missionKey] === 'string') {
        const originalMission = customReplacements[missionKey];
        // JSON.stringify escapes necessary characters and wraps the string in quotes.
        // slice(1, -1) removes these outer quotes.
        customReplacements[missionKey] = JSON.stringify(originalMission).slice(1, -1);
      }

      // Generate replacements for the specified network
      const networkReplacements = generateTemplateReplacements(
        network,
        tokenSymbol,
        customReplacements
      );

      // Log the contract being generated
      dbgLog(`Generating contract ${contract.name} for network ${network}`, {
        logType: "info",
      });

      // Use the existing method to generate the contract
      return this.generateContract(contract, networkReplacements, env);
    } catch (error) {
      // Log the error but don't throw it
      dbgLog(
        `Error generating contract ${contract.name} for network ${network}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { logType: "error" }
      );

      throw new Error(
        `Failed to generate contract on ${network} for ${contract.name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
