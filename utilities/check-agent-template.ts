import { TemplateScanner } from "./template-scanner";
import { generateTemplateReplacements } from "./template-variables";
import { dbgLog } from "./debug-logging";

/**
 * Check if all template variables for the agent account contract will be filled
 * when the API is called
 */
function checkAgentTemplate() {
  // Get standard replacements for all environments
  const environments = ["devnet", "testnet", "mainnet"] as const;
  
  for (const env of environments) {
    console.log(`\n=== Checking agent-account template with ${env} replacements ===\n`);
    
    const replacements = generateTemplateReplacements(env);
    
    // Check the agent account contract
    const validation = TemplateScanner.validateContractReplacements(
      "aibtc-agent-account", 
      replacements
    );
    
    if (validation.valid) {
      console.log(`✅ All template variables will be filled in ${env} environment`);
    } else {
      console.log(`❌ Missing template variables in ${env} environment:`);
      validation.missingVariables.forEach(variable => {
        console.log(`  - ${variable}`);
      });
    }
  }
}

// Run the check if this file is executed directly
if (require.main === module) {
  checkAgentTemplate();
}

export { checkAgentTemplate };
