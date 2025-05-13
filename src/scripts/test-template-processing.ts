import { ContractRegistry } from "../../utilities/contract-registry";
import { ContractGeneratorService } from "../services/contract-generator";
import { TemplateScanner } from "../../utilities/template-scanner";
import { getKnownAddresses } from "../../utilities/known-addresses";
import { getKnownTraits } from "../../utilities/contract-traits";
import fs from "node:fs";
import path from "node:path";

/**
 * Test script to process a single contract template
 */
async function testTemplateProcessing() {
  // Initialize registry
  const registry = new ContractRegistry();
  registry.registerAllDefinedContracts();
  
  // Create generator service
  const generator = new ContractGeneratorService();
  
  // Test with a specific contract
  const contractName = process.argv[2] || "aibtc-base-dao";
  const contract = registry.getContract(contractName);
  
  if (contract) {
    console.log(`Testing template processing for: ${contract.name} (${contract.type}/${contract.subtype})`);
    console.log(`Template path: ${contract.templatePath}`);
    
    try {
      // Get addresses and traits for devnet
      const addresses = getKnownAddresses("devnet");
      const traits = getKnownTraits("devnet");
      
      // Create replacements map that matches the /g/ format in the contracts
      const replacements: Record<string, string> = {
        // Account addresses
        "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/account_owner": "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
        "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG/account_agent": "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
        
        // Contract references
        ".aibtc-dao-traits.extension/dao_trait_extension": ".test-traits.extension",
        ".aibtc-dao-traits.action/dao_trait_action_proposals_voting": ".test-traits.action-proposals-voting",
        ".aibtc-dao-traits.action/dao_trait_action": ".test-traits.action",
        
        // DAO contracts
        ".aibtc-dao-users/dao_contract_users": ".test-dao-users",
        ".aibtc-treasury/dao_contract_treasury": ".test-treasury",
        ".aibtc-faktory/dao_contract_token": ".test-token-contract",
        ".aibtc-faktory-dex/dao_contract_token_dex": ".test-dex-contract",
        ".aibtc-base-dao/dao_contract_base": ".test-base-dao",
        
        // External contracts
        "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/sbtc_contract": "ST000000000000000000002AMW42H.sbtc-token",
        
        // Configuration values
        "dao mission goes here/dao_manifest": "The mission of this DAO is to test template processing",
        "aibtc/dao_token_symbol": "TEST",
      };
      
      // Generate contract
      const content = await generator.generateContract(contract, replacements);
      
      // Output preview
      console.log("\nGenerated content preview:");
      console.log(content.substring(0, 500) + "...");
      
      // Save to file
      const outputDir = path.join(process.cwd(), "test-output");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, `${contract.name}.clar`);
      fs.writeFileSync(outputPath, content);
      console.log(`\nFull content saved to: ${outputPath}`);
      
    } catch (error) {
      console.error("Error generating contract:", error);
    }
  } else {
    console.error(`Contract "${contractName}" not found`);
    console.log("Available contracts:", registry.getAllContractNames());
  }
}

/**
 * Generate a report of all template variables
 */
async function generateVariableReport() {
  const outputPath = path.join(process.cwd(), "template-variables-report.json");
  await TemplateScanner.saveVariableReport(outputPath);
}

/**
 * Test DAO and Agent contracts specifically
 */
async function testDaoAndAgentContracts() {
  const registry = new ContractRegistry();
  registry.registerAllDefinedContracts();
  
  const generator = new ContractGeneratorService();
  
  // Create replacements that match the /g/ format in the contracts
  const replacements: Record<string, string> = {
    // Account addresses
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/account_owner": "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
    "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG/account_agent": "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
    
    // Contract references
    ".aibtc-dao-traits.extension/dao_trait_extension": ".test-traits.extension",
    ".aibtc-dao-traits.action/dao_trait_action_proposals_voting": ".test-traits.action-proposals-voting",
    ".aibtc-dao-traits.action/dao_trait_action": ".test-traits.action",
    
    // DAO contracts
    ".aibtc-dao-users/dao_contract_users": ".test-dao-users",
    ".aibtc-treasury/dao_contract_treasury": ".test-treasury",
    ".aibtc-faktory/dao_contract_token": ".test-token-contract",
    ".aibtc-faktory-dex/dao_contract_token_dex": ".test-dex-contract",
    ".aibtc-base-dao/dao_contract_base": ".test-base-dao",
    ".aibtc-action-proposal-voting/dao_contract_action_proposal_voting": ".test-proposal-voting",
    ".aibtc-dao-charter/dao_contract_charter": ".test-dao-charter",
    ".aibtc-dao-epoch/dao_contract_epoch": ".test-dao-epoch",
    ".aibtc-onchain-messaging/dao_contract_messaging": ".test-messaging",
    ".aibtc-token-owner/dao_token_owner_contract": ".test-token-owner",
    ".aibtc-action-send-message/dao_action_send_message_contract": ".test-send-message",
    
    // External contracts
    "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/sbtc_contract": "ST000000000000000000002AMW42H.sbtc-token",
    
    // Configuration values
    "dao mission goes here/dao_manifest": "The mission of this DAO is to test template processing",
    "aibtc/dao_token_symbol": "TEST",
  };
  
  // Test specific contracts
  const contractsToTest = [
    "aibtc-action-proposal-voting",
    "aibtc-agent-account",
    "aibtc-base-initialize-dao"
  ];
  
  const results = {
    success: [] as string[],
    failure: [] as {name: string, error: string}[]
  };
  
  for (const contractName of contractsToTest) {
    const contract = registry.getContract(contractName);
    if (contract) {
      try {
        const content = await generator.generateContract(contract, replacements);
        results.success.push(contract.name);
        
        // Save to file for inspection
        const outputDir = path.join(process.cwd(), "test-output");
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const outputPath = path.join(outputDir, `${contract.name}.clar`);
        fs.writeFileSync(outputPath, content);
        console.log(`Generated ${contract.name} saved to: ${outputPath}`);
        
      } catch (error) {
        results.failure.push({
          name: contract.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    } else {
      results.failure.push({
        name: contractName,
        error: "Contract not found in registry"
      });
    }
  }
  
  return results;
}

// Run the script
if (process.argv.includes("--report")) {
  generateVariableReport().catch(console.error);
} else if (process.argv.includes("--test-dao")) {
  testDaoAndAgentContracts()
    .then(results => {
      console.log(`Successfully processed: ${results.success.length} contracts`);
      console.log(`Success: ${results.success.join(', ')}`);
      
      if (results.failure.length > 0) {
        console.error(`Failed to process: ${results.failure.length} contracts`);
        results.failure.forEach(f => {
          console.error(`- ${f.name}: ${f.error}`);
        });
      }
    })
    .catch(console.error);
} else {
  testTemplateProcessing().catch(console.error);
}
