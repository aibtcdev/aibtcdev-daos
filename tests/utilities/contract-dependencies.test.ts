import { describe, expect, it } from "vitest";
import { ContractRegistry } from "../../utilities/contract-registry";
import { ContractGeneratorService } from "../../src/services/contract-generator";
import { defineAllDaoContractDependencies } from "../../utilities/contract-dependencies";
import { generateTemplateReplacements } from "../../utilities/template-variables";
import fs from "node:fs";
import path from "node:path";

describe("Contract Dependencies", () => {
  // Setup output directory for generated contracts
  const outputDir = path.join(process.cwd(), "generated-contracts/test-output/dependencies");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  it("should register all dependencies correctly", () => {
    const registry = new ContractRegistry();
    registry.registerAllDefinedContracts();
    defineAllDaoContractDependencies(registry);

    // Verify some key contracts have dependencies
    const baseDaoContract = registry.getContract("aibtc-base-dao");
    expect(baseDaoContract).toBeDefined();
    expect(baseDaoContract?.getDependencies().length).toBeGreaterThan(0);

    const agentContract = registry.getContract("aibtc-agent-account");
    expect(agentContract).toBeDefined();
    expect(agentContract?.getDependencies().length).toBeGreaterThan(0);

    const actionContract = registry.getContract("aibtc-action-send-message");
    expect(actionContract).toBeDefined();
    expect(actionContract?.getDependencies().length).toBeGreaterThan(0);
  });

  it("should generate contracts with all dependencies resolved", async () => {
    // Create registry with dependencies
    const registry = new ContractRegistry();
    registry.registerAllDefinedContracts();
    defineAllDaoContractDependencies(registry);
    
    // Create generator
    const generator = new ContractGeneratorService();
    
    // Get standard replacements for devnet
    const replacements = generateTemplateReplacements("devnet", "aibtc");
    
    // Add any custom runtime values needed for testing
    const testReplacements = {
      ...replacements,
      "dao mission goes here/dao_manifest": "Test DAO mission for dependency testing"
    };
    
    // Test a few key contracts
    const contractsToTest = [
      "aibtc-base-dao",
      "aibtc-action-send-message",
      "aibtc-base-initialize-dao"
    ];
    
    for (const contractName of contractsToTest) {
      const contract = registry.getContract(contractName);
      expect(contract).toBeDefined();
      
      if (contract) {
        try {
          // Generate the contract
          const content = await generator.generateContract(contract, testReplacements);
          
          // Verify content was generated
          expect(content).toBeTruthy();
          expect(content.length).toBeGreaterThan(0);
          
          // Save for inspection
          const outputPath = path.join(outputDir, `${contract.name}.clar`);
          fs.writeFileSync(outputPath, content);
          
          // Log success
          console.log(`Successfully generated ${contract.name} with all dependencies resolved`);
        } catch (error) {
          // Format error for better readability
          if (error instanceof Error) {
            console.error(`Error generating ${contractName}:`);
            console.error(error.message);
            
            // If the error contains missing template variables, extract them
            if (error.message.includes("MISSING TEMPLATE VARIABLE")) {
              const missingVars = error.message
                .split("\n")
                .filter(line => line.includes("Expected key:"))
                .map(line => line.replace("Expected key:", "").trim());
              
              console.error("Missing template variables:", missingVars);
            }
          }
          
          // Fail the test
          throw error;
        }
      }
    }
  });

  it("should handle API-provided runtime values", async () => {
    // Create registry with dependencies
    const registry = new ContractRegistry();
    registry.registerAllDefinedContracts();
    defineAllDaoContractDependencies(registry);
    
    // Create generator
    const generator = new ContractGeneratorService();
    
    // Simulate API request with runtime values
    const apiProvidedValues = {
      "dao_token_symbol": "TESTAPI",
      "dao_token_name": "Test API Token",
      "dao_token_decimals": "6",
      "dao_manifest": "This is a DAO created via API with runtime values"
    };
    
    // Get base replacements but override with API values
    const baseReplacements = generateTemplateReplacements("devnet", "aibtc");
    
    // Create custom replacements map that simulates API input
    const customReplacements: Record<string, string> = {};
    
    // Add API values to the appropriate template variables
    Object.entries(apiProvidedValues).forEach(([key, value]) => {
      if (key === "dao_token_symbol") {
        customReplacements["dao_token_symbol"] = value.toUpperCase();
      } else if (key === "dao_manifest") {
        customReplacements["dao_manifest"] = value;
      } else {
        // Other runtime values
        customReplacements[key] = value;
      }
    });
    
    // Merge with base replacements, letting custom values override
    const mergedReplacements = {
      ...baseReplacements,
      ...customReplacements
    };
    
    // Test the initialize-dao contract which uses many runtime values
    const contract = registry.getContract("aibtc-base-initialize-dao");
    expect(contract).toBeDefined();
    
    if (contract) {
      try {
        // Generate the contract
        const content = await generator.generateContract(contract, mergedReplacements);
        
        // Verify content was generated
        expect(content).toBeTruthy();
        expect(content.length).toBeGreaterThan(0);
        
        // Verify API values were used
        expect(content).toContain("TESTAPI");
        expect(content).toContain("This is a DAO created via API with runtime values");
        
        // Save for inspection
        const outputPath = path.join(outputDir, `api-${contract.name}.clar`);
        fs.writeFileSync(outputPath, content);
        
        console.log(`Successfully generated ${contract.name} with API-provided runtime values`);
      } catch (error) {
        console.error("Error generating contract with API values:", error);
        throw error;
      }
    }
  });

  it("should simulate API endpoint contract generation", async () => {
    // Create registry with dependencies
    const registry = new ContractRegistry();
    registry.registerAllDefinedContracts();
    defineAllDaoContractDependencies(registry);
    
    // Create generator
    const generator = new ContractGeneratorService();
    
    // Simulate API request with only runtime values
    const apiRequest = {
      tokenSymbol: "CUSTOM",
      manifest: "This DAO was created via the API",
      contractsToGenerate: ["aibtc-base-dao", "aibtc-base-initialize-dao", "aibtc-action-send-message"]
    };
    
    // Get base replacements for the network, but keep using "aibtc" for template keys
    // This is important because the template files still use "aibtc" in their variable references
    const baseReplacements = generateTemplateReplacements("devnet", "aibtc");
    
    // Override with API-provided values
    const customReplacements = {
      "dao_token_symbol": apiRequest.tokenSymbol.toUpperCase(),
      "dao_manifest": apiRequest.manifest
    };
    
    // Merge replacements
    const mergedReplacements = {
      ...baseReplacements,
      ...customReplacements
    };
    
    // Generate each requested contract
    const results: Record<string, { success: boolean; content?: string; error?: string }> = {};
    
    for (const contractName of apiRequest.contractsToGenerate) {
      const contract = registry.getContract(contractName);
      expect(contract).toBeDefined();
      
      if (contract) {
        try {
          // Generate the contract
          const content = await generator.generateContract(contract, mergedReplacements);
          
          // Store result
          results[contractName] = {
            success: true,
            content: content
          };
          
          // Save for inspection
          const outputPath = path.join(outputDir, `api-simulation-${contractName}.clar`);
          fs.writeFileSync(outputPath, content);
          
          console.log(`Successfully generated ${contractName} for API simulation`);
        } catch (error) {
          results[contractName] = {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
          
          console.error(`Failed to generate ${contractName}:`, 
            error instanceof Error ? error.message : String(error));
        }
      }
    }
    
    // Verify all contracts were generated successfully
    for (const contractName of apiRequest.contractsToGenerate) {
      expect(results[contractName].success).toBe(true);
      
      // Verify custom values were applied
      if (results[contractName].success && results[contractName].content) {
        expect(results[contractName].content).toContain(apiRequest.tokenSymbol.toUpperCase());
        
        // For initialize-dao, also check manifest
        if (contractName === "aibtc-base-initialize-dao") {
          expect(results[contractName].content).toContain(apiRequest.manifest);
        }
      }
    }
  });
});
