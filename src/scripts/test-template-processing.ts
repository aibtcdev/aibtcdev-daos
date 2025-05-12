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
      
      // Create replacements map
      const replacements: Record<string, string> = {
        // Contract addresses
        "contract.deployer": addresses.DEPLOYER,
        "contract.sbtc": addresses.SBTC,
        "contract.pox": addresses.POX,
        
        // Traits
        "trait.sip009": traits.STANDARD_SIP009,
        "trait.sip010": traits.STANDARD_SIP010,
        "trait.faktory": traits.FAKTORY_SIP010,
        
        // Contract references (with deployer prefix)
        "contract.base-dao": `${addresses.DEPLOYER}.aibtc-base-dao`,
        "contract.token": `${addresses.DEPLOYER}.aibtc-faktory`,
        "contract.dex": `${addresses.DEPLOYER}.aibtc-faktory-dex`,
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

// Run the script
if (process.argv.includes("--report")) {
  generateVariableReport().catch(console.error);
} else {
  testTemplateProcessing().catch(console.error);
}
