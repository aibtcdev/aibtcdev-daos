import { ContractRegistry } from "../../utilities/contract-registry";
import { ContractGeneratorService } from "../services/contract-generator";
import { getKnownAddresses } from "../../utilities/known-addresses";
import { getKnownTraits } from "../../utilities/contract-traits";
import fs from "node:fs";
import path from "node:path";

/**
 * Script to generate all contracts from templates and save them to files
 */
async function generateAllContracts() {
  // Initialize registry and register all contracts
  const registry = new ContractRegistry();
  registry.registerAllDefinedContracts();

  // Create generator service
  const generatorService = new ContractGeneratorService();

  // Create output directory
  const outputDir = path.join(
    process.cwd(),
    "generated-contracts"
  );
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get all contracts from registry
  const allContracts = registry.getAllContracts();
  console.log(`Generating ${allContracts.length} contracts...`);

  // Generate each contract
  let successCount = 0;
  for (const contract of allContracts) {
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
      
      // Generate with replacements
      const generatedContent = await generatorService.generateContract(
        contract,
        replacements
      );

      // Create subdirectory based on contract type
      const typeDir = path.join(outputDir, contract.type.toLowerCase());
      if (!fs.existsSync(typeDir)) {
        fs.mkdirSync(typeDir, { recursive: true });
      }

      // Write to file
      const filePath = path.join(typeDir, `${contract.name}.clar`);
      fs.writeFileSync(filePath, generatedContent);
      console.log(`Generated: ${contract.type}/${contract.name}`);
    } catch (error) {
      console.error(`Error generating ${contract.name}:`, error);
    }
  }

  console.log(`Generated ${successCount}/${allContracts.length} contracts in: ${outputDir}`);
}

// Run the script
generateAllContracts().catch((error) => {
  console.error("Error generating contracts:", error);
  process.exit(1);
});
