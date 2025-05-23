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
    replacements[key.toLowerCase()] = `'${value}`;
    replacements[`trait_${key.toLowerCase()}`] = `'${value}`;

    const traitParts = value.split('.');
    if (traitParts.length >= 2) {
      const contractPath = traitParts.slice(0, -1).join('.');
      const traitName = traitParts[traitParts.length - 1];
      replacements[`${contractPath}.${traitName}/trait_${key.toLowerCase()}`] = `'${value}`;
    }
  });

  // Add specific template variable formats for traits as found in .clar files
  const traitMappings: { templateKeyName: string, knownTraitKey: keyof KnownTraits, templateToReplacePattern: string
}[] = [
    { templateKeyName: "dao_trait_base", knownTraitKey: "DAO_BASE", templateToReplacePattern:
`.${templateKeySymbol}-base-dao-trait.${templateKeySymbol}-base-dao` },
    { templateKeyName: "dao_trait_proposal", knownTraitKey: "DAO_PROPOSAL", templateToReplacePattern:
`.${templateKeySymbol}-dao-traits.proposal` },
    { templateKeyName: "dao_trait_extension", knownTraitKey: "DAO_EXTENSION", templateToReplacePattern:
`.${templateKeySymbol}-dao-traits.extension` },
    { templateKeyName: "dao_trait_action_proposal_voting", knownTraitKey: "DAO_ACTION_PROPOSAL_VOTING",
templateToReplacePattern: `.${templateKeySymbol}-dao-traits.action-proposal-voting` },
    { templateKeyName: "dao_trait_action", knownTraitKey: "DAO_ACTION", templateToReplacePattern:
`.${templateKeySymbol}-dao-traits.action` },
  ];

  traitMappings.forEach(mapping => {
    const traitValue = traits[mapping.knownTraitKey];
    if (traitValue) {
      const fullKey = `${mapping.templateToReplacePattern}/${mapping.templateKeyName}`;
      replacements[fullKey] = `'${traitValue}'`;
    }
  });

  // 3. Add all contract names in both formats
  for (const type of CONTRACT_TYPES) {
    const subtypes = CONTRACT_SUBTYPES[type];

    for (const subtype of subtypes) {
      const contractName = CONTRACT_NAMES[type][subtype as ContractSubtype<typeof type>];
      if (contractName) {
        const symbolizedName = contractName.replace(templateKeySymbol, symbol);
        const actualContractRef = `.${symbolizedName}`;
        const placeholderContractRef = `.${contractName}`; // This is the TO_REPLACE part from template comments

        const standardKeyName = `dao_contract_${type.toLowerCase()}_${subtype.toLowerCase()}`;
        replacements[standardKeyName] = actualContractRef;
        replacements[`${placeholderContractRef}/${standardKeyName}`] = actualContractRef;

        if (type === "BASE" && subtype === "DAO") {
          const simplifiedTemplateKeyName = "dao_contract_base";
          replacements[simplifiedTemplateKeyName] = actualContractRef;
          replacements[`${placeholderContractRef}/${simplifiedTemplateKeyName}`] = actualContractRef;
        } else if (type === "TOKEN") {
          const tokenSubtypeMapping: Record<string, string> = {
            "DAO": "dao_contract_token",
            "DEX": "dao_contract_token_dex",
            "PRELAUNCH": "dao_contract_token_prelaunch",
            "POOL": "dao_contract_token_pool"
          };
          const simplifiedTemplateKeyName = tokenSubtypeMapping[subtype];
          if (simplifiedTemplateKeyName) {
            replacements[simplifiedTemplateKeyName] = actualContractRef;
            replacements[`${placeholderContractRef}/${simplifiedTemplateKeyName}`] = actualContractRef;
          }
        } else if (type === "EXTENSIONS") {
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
          const simplifiedSubkey = extensionMapping[subtype];
          if (simplifiedSubkey) {
            const simplifiedTemplateKeyName = `dao_contract_${simplifiedSubkey}`;
            replacements[simplifiedTemplateKeyName] = actualContractRef;
            replacements[`${placeholderContractRef}/${simplifiedTemplateKeyName}`] = actualContractRef;
          }
        } else if (type === "ACTIONS") {
          if (subtype === "SEND_MESSAGE") {
            const simplifiedTemplateKeyName1 = "dao_action_send_message";
            replacements[simplifiedTemplateKeyName1] = actualContractRef;
            replacements[`${placeholderContractRef}/${simplifiedTemplateKeyName1}`] = actualContractRef;

            const simplifiedTemplateKeyName2 = "dao_action_send_message_contract";
            replacements[simplifiedTemplateKeyName2] = actualContractRef;
            replacements[`${placeholderContractRef}/${simplifiedTemplateKeyName2}`] = actualContractRef;
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
  replacements[`.${templateKeySymbol}-run-cost/base_contract_dao_run_cost`] = `'${addresses.AIBTC_RUN_COST}'`; // Adjusted to use templateKeySymbol
  replacements["base_contract_dao_run_cost"] = `'${addresses.AIBTC_RUN_COST}'`;

  // 6. Add DAO manifest
  replacements[`${templateKeySymbol} mission goes here/dao_manifest`] = `The mission of the ${symbol} is to...`; // Adjusted to use templateKeySymbol
  replacements["dao_manifest"] = `The mission of the ${symbol} is to...`;

  // 7. Add agent account specific replacements
  const agentTraitKeys: (keyof KnownTraits)[] = [
    "AGENT_ACCOUNT",
    "AGENT_FAKTORY_DEX_APPROVAL",
    "AGENT_ACCOUNT_PROPOSALS",
    "AGENT_FAKTORY_BUY_SELL"
  ];

  agentTraitKeys.forEach(key => {
    const traitValue = traits[key];
    if (traitValue) {
      const lowerKey = (key as string).toLowerCase();
      const formattedKey = lowerKey.replace(/^agent_/, '');
      const templateKeyName = `agent_account_trait_${formattedKey}`;

      replacements[templateKeyName] = `'${traitValue}'`;

      const traitParts = traitValue.split('.');
      if (traitParts.length >= 2) {
        const contractPath = traitParts.slice(0, -1).join('.');
        const traitName = traitParts[traitParts.length - 1];
        replacements[`${contractPath}.${traitName}/${templateKeyName}`] = `'${traitValue}'`;
      }
    }
  });

  replacements[`${addresses.DEPLOYER.split('.')[0]}/account_owner`] = addresses.DEPLOYER; // Adjusted for dynamic deployer prefix
  replacements["account_owner"] = addresses.DEPLOYER;
  // Assuming ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG is a fixed address or needs to be in known-addresses
  const defaultAgentAddress = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
  replacements[`${defaultAgentAddress.split('.')[0]}/account_agent`] = defaultAgentAddress;
  replacements["account_agent"] = defaultAgentAddress;

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
