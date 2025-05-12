import { ContractRegistry } from "../../utilities/contract-registry";
import { ContractGeneratorService } from "../services/contract-generator";
import fs from "node:fs";
import path from "node:path";

/**
 * Script to generate all contracts from templates and save them to files
 */
async function generateAllContracts() {
  // Initialize registry
  const registry = new ContractRegistry();

  // Create generator service
  const generatorService = new ContractGeneratorService();

  // Create output directory
  const outputDir = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "../../generated-contracts"
  );
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get all contracts from registry
  const allContracts = registry.getAllContracts();
  console.log(`Generating ${allContracts.length} contracts...`);

  // Generate each contract
  for (const contract of allContracts) {
    try {
      // Generate with empty replacements (or customize as needed)
      const generatedContent = await generatorService.generateContract(
        contract,
        {}
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

  console.log(`All contracts generated in: ${outputDir}`);
}

// Run the script
generateAllContracts().catch((error) => {
  console.error("Error generating contracts:", error);
  process.exit(1);
});
