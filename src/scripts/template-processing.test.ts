import { describe, it, expect, beforeAll } from "vitest";
import { ContractRegistry } from "../../utilities/contract-registry";
import { ContractGeneratorService } from "../services/contract-generator";
import { TemplateScanner } from "../../utilities/template-scanner";
import fs from "node:fs";
import path from "node:path";

describe("Template Processing", () => {
  let registry: ContractRegistry;
  let generator: ContractGeneratorService;
  let outputDir: string;
  
  // Standard replacements for tests
  const replacements: Record<string, string> = {
    // Account addresses
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/account_owner": "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
    "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG/account_agent": "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
    
    // Contract references
    ".aibtc-dao-traits.extension/dao_trait_extension": ".test-traits.extension",
    ".aibtc-dao-traits.action/dao_trait_action_proposals_voting": ".test-traits.action-proposals-voting",
    ".aibtc-dao-traits.action/dao_trait_action": ".test-traits.action",
    ".aibtc-dao-traits.proposal/dao_trait_proposal": ".test-traits.proposal",
    ".aibtc-dao-traits.token-owner/dao_token_owner_trait": ".test-traits.token-owner",
    
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

  beforeAll(() => {
    registry = new ContractRegistry();
    registry.registerAllDefinedContracts();
    
    generator = new ContractGeneratorService();
    
    // Create output directory for test results
    outputDir = path.join(process.cwd(), "test-output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  it("should process a single contract template", async () => {
    const contractName = "aibtc-base-dao";
    const contract = registry.getContract(contractName);
    
    expect(contract).not.toBeUndefined();
    
    if (contract) {
      const content = await generator.generateContract(contract, replacements);
      
      // Basic validation
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(0);
      
      // Save for inspection
      const outputPath = path.join(outputDir, `${contract.name}.clar`);
      fs.writeFileSync(outputPath, content);
    }
  });

  it("should process DAO and Agent contracts", async () => {
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
      
      expect(contract).not.toBeUndefined();
      
      if (contract) {
        try {
          const content = await generator.generateContract(contract, replacements);
          
          // Basic validation
          expect(content).toBeTruthy();
          expect(content.length).toBeGreaterThan(0);
          
          results.success.push(contract.name);
          
          // Save for inspection
          const outputPath = path.join(outputDir, `${contract.name}.clar`);
          fs.writeFileSync(outputPath, content);
          
        } catch (error) {
          results.failure.push({
            name: contract.name,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
    
    // Verify all contracts were processed successfully
    expect(results.failure.length).toBe(0);
    expect(results.success.length).toBe(contractsToTest.length);
  });

  it("should generate a variable report", async () => {
    const report = await TemplateScanner.scanAllTemplates();
    
    // Basic validation
    expect(report).toBeTruthy();
    expect(Object.keys(report).length).toBeGreaterThan(0);
    
    // Save for inspection
    const outputPath = path.join(outputDir, "template-variables-report.json");
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  });
});
