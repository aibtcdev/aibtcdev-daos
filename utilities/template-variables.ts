import { StacksNetworkName } from "@stacks/network";
import { getKnownTraits, KnownTraits } from "./known-traits";
import { getKnownAddresses, KnownAddresses } from "./known-addresses";
import { CONTRACT_TYPES, CONTRACT_SUBTYPES, CONTRACT_NAMES, ContractSubtype } from "./contract-types";

/**
 * Generate a complete set of template variable replacements for a given network
 *
 * Note: Template variables in contracts are formatted as: ;; /g/variable/replacement_key
 */
export function generateTemplateReplacements(
  network: StacksNetworkName,
  tokenSymbol: string = "aibtc",
  customReplacements: Record<string, string> = {}
): Record<string, string> {
  const traits = getKnownTraits(network);
  const addresses = getKnownAddresses(network);
  const templateKeySymbol = "aibtc"; // Always use "aibtc" for template keys
  const symbol = tokenSymbol;
  
  const replacements: Record<string, string> = {};
  
  // 1. Add all known addresses in both formats
  Object.entries(addresses).forEach(([key, value]) => {
    replacements[key.toLowerCase()] = value;
    replacements[`address_${key.toLowerCase()}`] = value;
  });
  
  // 2. Add all known traits in both formats
  Object.entries(traits).forEach(([key, value]) => {
    // Format with quotes for trait references
    replacements[key.toLowerCase()] = `'${value}`;
    replacements[`trait_${key.toLowerCase()}`] = `'${value}`;
    
    // Also add the full path format that appears in templates
    const traitParts = value.split('.');
    if (traitParts.length >= 2) {
      const contractPath = traitParts.slice(0, -1).join('.');
      const traitName = traitParts[traitParts.length - 1];
      replacements[`${contractPath}.${traitName}/trait_${key.toLowerCase()}`] = `'${value}`;
    }
  });
  
  // 3. Add all contract names in both formats
  for (const type of CONTRACT_TYPES) {
    const subtypes = CONTRACT_SUBTYPES[type];
    
    for (const subtype of subtypes) {
      const contractName = CONTRACT_NAMES[type][subtype as ContractSubtype<typeof type>];
      if (contractName) {
        // Replace aibtc with the token symbol in contract names
        const symbolizedName = contractName.replace(templateKeySymbol, symbol);
        
        // Add contract reference with dot prefix
        const contractRef = `.${symbolizedName}`;
        
        // Standard key format: dao_contract_type_subtype
        const standardKey = `dao_contract_${type.toLowerCase()}_${subtype.toLowerCase()}`;
        replacements[standardKey] = contractRef;
        
        // Full path format: .original-name/dao_contract_type_subtype
        replacements[`.${contractName}/${standardKey}`] = contractRef;
        
        // Simplified key format for common references
        if (type === "BASE" && subtype === "DAO") {
          replacements["dao_contract_base"] = contractRef;
        } else if (type === "TOKEN") {
          if (subtype === "DAO") {
            replacements["dao_contract_token"] = contractRef;
          } else if (subtype === "DEX") {
            replacements["dao_contract_token_dex"] = contractRef;
          } else if (subtype === "PRELAUNCH") {
            replacements["dao_contract_token_prelaunch"] = contractRef;
          } else if (subtype === "POOL") {
            replacements["dao_contract_token_pool"] = contractRef;
          }
        } else if (type === "EXTENSIONS") {
          // Map extension subtypes to their common reference names
          const extensionMapping: Record<string, string> = {
            "ACTION_PROPOSAL_VOTING": "action_proposal_voting",
            "DAO_CHARTER": "charter",
            "DAO_EPOCH": "epoch",
            "DAO_USERS": "users",
            "ONCHAIN_MESSAGING": "messaging",
            "REWARDS_ACCOUNT": "rewards_account",
            "TOKEN_OWNER": "token_owner",
            "TREASURY": "treasury"
          };
          
          const simplifiedKey = extensionMapping[subtype];
          if (simplifiedKey) {
            replacements[`dao_contract_${simplifiedKey}`] = contractRef;
          }
        } else if (type === "ACTIONS") {
          // Map action subtypes to their common reference names
          if (subtype === "SEND_MESSAGE") {
            replacements["dao_action_send_message"] = contractRef;
            replacements["dao_action_send_message_contract"] = contractRef;
          }
        }
      }
    }
  }
  
  // 4. Add basic token info
  replacements[`${templateKeySymbol}/dao_token_symbol`] = symbol;
  replacements["dao_token_symbol"] = symbol;
  replacements["dao_token_name"] = symbol;
  replacements["dao_token_decimals"] = "8";
  
  // 5. Add external contracts and special cases
  replacements["sbtc_contract"] = addresses.SBTC;
  replacements["sbtc_token_contract"] = addresses.SBTC;
  replacements["base_contract_sbtc"] = addresses.SBTC;
  replacements["external_bitflow_core"] = addresses.BITFLOW_CORE;
  replacements[".dao-run-cost/base_contract_dao_run_cost"] = `'${addresses.AIBTC_RUN_COST}`;
  replacements["base_contract_dao_run_cost"] = `'${addresses.AIBTC_RUN_COST}`;
  
  // 6. Add DAO manifest
  replacements["dao_manifest"] = `The mission of the ${symbol} is to...`;
  
  // 7. Add agent account specific replacements
  const agentTraitKeys = [
    "AGENT_ACCOUNT", 
    "AGENT_FAKTORY_DEX_APPROVAL", 
    "AGENT_ACCOUNT_PROPOSALS", 
    "AGENT_FAKTORY_BUY_SELL"
  ];
  
  agentTraitKeys.forEach(key => {
    const traitValue = traits[key as keyof KnownTraits];
    const lowerKey = key.toLowerCase();
    const formattedKey = lowerKey.replace(/^agent_/, '');
    
    replacements[`agent_account_trait_${formattedKey}`] = `'${traitValue}`;
    
    // Also add the full path format
    const traitParts = traitValue.split('.');
    if (traitParts.length >= 2) {
      const contractPath = traitParts.slice(0, -1).join('.');
      const traitName = traitParts[traitParts.length - 1];
      replacements[`${contractPath}.${traitName}/agent_account_trait_${formattedKey}`] = `'${traitValue}`;
    }
  });
  
  // Default agent account addresses
  replacements["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/account_owner"] = addresses.DEPLOYER;
  replacements["account_owner"] = addresses.DEPLOYER;
  replacements["ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG/account_agent"] = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
  replacements["account_agent"] = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
  
  // 8. Merge with custom replacements (which take precedence)
  return {
    ...replacements,
    ...customReplacements,
  };
}

/**
 * Get a list of all known template variables
 */
export function getAllKnownTemplateVariables(): string[] {
  // Generate a complete set of replacements for devnet
  const replacements = generateTemplateReplacements("devnet");

  // Return the keys
  return Object.keys(replacements);
}
