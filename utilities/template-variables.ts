import { StacksNetworkName } from "@stacks/network";
import { getKnownTraits, KnownTraits } from "./known-traits";
import { getKnownAddresses } from "./known-addresses";
import {
  CONTRACT_TYPES,
  CONTRACT_SUBTYPES,
  CONTRACT_NAMES,
  ContractSubtype,
} from "./contract-types";

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

    const traitParts = value.split(".");
    if (traitParts.length >= 2) {
      const contractPath = traitParts.slice(0, -1).join(".");
      const traitName = traitParts[traitParts.length - 1];
      replacements[
        `${contractPath}.${traitName}/trait_${key.toLowerCase()}`
      ] = `'${value}`;
    }
  });

  // Add BASE_SIP010 trait specifically
  const baseSip010Trait = traits["BASE_SIP010"];
  if (baseSip010Trait) {
    replacements["base_trait_sip010"] = `'${baseSip010Trait}`;
    // Add the common toReplace pattern observed in the scanner output
    replacements[
      `SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait/base_trait_sip010`
    ] = `'${baseSip010Trait}`;
  }

  // Add specific template variable formats for traits as found in .clar files
  const traitMappings: {
    templateKeyName: string;
    knownTraitKey: keyof KnownTraits;
    templateToReplacePattern: string;
  }[] = [
    {
      templateKeyName: "dao_trait_base",
      knownTraitKey: "DAO_BASE",
      templateToReplacePattern: `.${templateKeySymbol}-base-dao-trait.${templateKeySymbol}-base-dao`,
    },
    {
      templateKeyName: "dao_trait_proposal",
      knownTraitKey: "DAO_PROPOSAL",
      templateToReplacePattern: `.${templateKeySymbol}-dao-traits.proposal`,
    },
    {
      templateKeyName: "dao_trait_extension",
      knownTraitKey: "DAO_EXTENSION",
      templateToReplacePattern: `.${templateKeySymbol}-dao-traits.extension`,
    },
    {
      templateKeyName: "dao_trait_action_proposal_voting",
      knownTraitKey: "DAO_ACTION_PROPOSAL_VOTING",
      templateToReplacePattern: `.${templateKeySymbol}-dao-traits.action-proposal-voting`,
    },
    {
      templateKeyName: "dao_trait_action",
      knownTraitKey: "DAO_ACTION",
      templateToReplacePattern: `.${templateKeySymbol}-dao-traits.action`,
    },
    {
      templateKeyName: "dao_trait_charter",
      knownTraitKey: "DAO_CHARTER",
      templateToReplacePattern: `.${templateKeySymbol}-dao-traits.dao-charter`,
    },
    {
      templateKeyName: "dao_trait_epoch",
      knownTraitKey: "DAO_EPOCH",
      templateToReplacePattern: `.${templateKeySymbol}-dao-traits.dao-epoch`,
    },
    {
      templateKeyName: "dao_trait_users",
      knownTraitKey: "DAO_USERS",
      templateToReplacePattern: `.${templateKeySymbol}-dao-traits.dao-users`,
    },
    {
      templateKeyName: "dao_trait_messaging",
      knownTraitKey: "DAO_MESSAGING",
      templateToReplacePattern: `.${templateKeySymbol}-dao-traits.messaging`,
    },
    {
      templateKeyName: "dao_trait_rewards_account",
      knownTraitKey: "DAO_REWARDS_ACCOUNT",
      templateToReplacePattern: `.${templateKeySymbol}-dao-traits.rewards-account`,
    },
    {
      templateKeyName: "dao_trait_token_owner",
      knownTraitKey: "DAO_TOKEN_OWNER",
      templateToReplacePattern: `.${templateKeySymbol}-dao-traits.token-owner`,
    },
    {
      templateKeyName: "dao_trait_treasury",
      knownTraitKey: "DAO_TREASURY",
      templateToReplacePattern: `.${templateKeySymbol}-dao-traits.treasury`,
    },
    {
      templateKeyName: "dao_trait_faktory_dex",
      knownTraitKey: "DAO_TOKEN_DEX",
      templateToReplacePattern: `.${templateKeySymbol}-dao-traits.faktory-dex`,
    },
    // For dao_trait_faktory_token, the toReplace pattern is the full trait string from the error
    {
      templateKeyName: "dao_trait_faktory_token",
      knownTraitKey: "FAKTORY_SIP010",
      templateToReplacePattern: traits["FAKTORY_SIP010"],
    }, // Uses the actual trait string as the toReplace key part
    // For dao_trait_faktory_sip010, the toReplace pattern is also the full trait string
    {
      templateKeyName: "dao_trait_faktory_sip010",
      knownTraitKey: "FAKTORY_SIP010",
      templateToReplacePattern: traits["FAKTORY_SIP010"],
    }, // Uses the actual trait string as the toReplace key part
  ];

  traitMappings.forEach((mapping) => {
    const traitValue = traits[mapping.knownTraitKey];
    if (traitValue) {
      const fullKey = `${mapping.templateToReplacePattern}/${mapping.templateKeyName}`;
      replacements[fullKey] = `'${traitValue}`;
      replacements[mapping.templateKeyName] = `'${traitValue}`;
    }
  });

  // 3. Add all contract names in both formats
  for (const type of CONTRACT_TYPES) {
    const subtypes = CONTRACT_SUBTYPES[type];

    for (const subtype of subtypes) {
      const contractName =
        CONTRACT_NAMES[type][subtype as ContractSubtype<typeof type>];
      if (contractName) {
        const symbolizedName = contractName.replace(templateKeySymbol, symbol);
        const actualContractRef = `.${symbolizedName}`;
        const placeholderContractRef = `.${contractName}`; // This is the TO_REPLACE part from template comments

        const standardKeyName = `dao_contract_${type.toLowerCase()}_${subtype.toLowerCase()}`;
        replacements[standardKeyName] = actualContractRef;
        replacements[`${placeholderContractRef}/${standardKeyName}`] =
          actualContractRef;

        if (type === "BASE" && subtype === "DAO") {
          const simplifiedTemplateKeyName = "dao_contract_base";
          replacements[simplifiedTemplateKeyName] = actualContractRef;
          replacements[
            `${placeholderContractRef}/${simplifiedTemplateKeyName}`
          ] = actualContractRef;
        } else if (type === "TOKEN") {
          const tokenSubtypeMapping: Record<string, string> = {
            DAO: "dao_contract_token",
            DEX: "dao_contract_token_dex",
            PRELAUNCH: "dao_contract_token_prelaunch",
            POOL: "dao_contract_token_pool",
          };
          const simplifiedTemplateKeyName = tokenSubtypeMapping[subtype];
          if (simplifiedTemplateKeyName) {
            replacements[simplifiedTemplateKeyName] = actualContractRef;
            replacements[
              `${placeholderContractRef}/${simplifiedTemplateKeyName}`
            ] = actualContractRef;
          }
        } else if (type === "EXTENSIONS") {
          const extensionMapping: Record<string, string> = {
            ACTION_PROPOSAL_VOTING: "action_proposal_voting",
            DAO_CHARTER: "charter",
            DAO_EPOCH: "epoch",
            DAO_USERS: "users",
            ONCHAIN_MESSAGING: "messaging",
            REWARDS_ACCOUNT: "rewards_account",
            TOKEN_OWNER: "token_owner",
            TREASURY: "treasury",
          };
          const simplifiedSubkey = extensionMapping[subtype];
          if (simplifiedSubkey) {
            const simplifiedTemplateKeyName = `dao_contract_${simplifiedSubkey}`;
            replacements[simplifiedTemplateKeyName] = actualContractRef;
            replacements[
              `${placeholderContractRef}/${simplifiedTemplateKeyName}`
            ] = actualContractRef;
          }
        } else if (type === "ACTIONS") {
          if (subtype === "SEND_MESSAGE") {
            const simplifiedTemplateKeyName1 = "dao_action_send_message";
            replacements[simplifiedTemplateKeyName1] = actualContractRef;
            replacements[
              `${placeholderContractRef}/${simplifiedTemplateKeyName1}`
            ] = actualContractRef;

            const simplifiedTemplateKeyName2 =
              "dao_action_send_message_contract";
            replacements[simplifiedTemplateKeyName2] = actualContractRef;
            replacements[
              `${placeholderContractRef}/${simplifiedTemplateKeyName2}`
            ] = actualContractRef;
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
  replacements[
    "dao_token_metadata"
  ] = `"https://example.com/metadata/${symbol}.json"`; // Placeholder metadata URL
  replacements[
    `link to json for token metadata/dao_token_metadata`
  ] = `"https://example.com/metadata/${symbol}.json"`;

  // 5. Add external contracts and special cases
  replacements["sbtc_contract"] = addresses.SBTC;
  replacements["sbtc_token_contract"] = addresses.SBTC;
  replacements["base_contract_sbtc"] = addresses.SBTC;
  replacements["external_bitflow_core"] = addresses.BITFLOW_CORE;
  replacements[
    `.${templateKeySymbol}-run-cost/base_contract_dao_run_cost`
  ] = `'${addresses.AIBTC_RUN_COST}`; // Adjusted to use templateKeySymbol
  replacements["base_contract_dao_run_cost"] = `'${addresses.AIBTC_RUN_COST}`;

  // Add origin_address (typically deployer)
  replacements["origin_address"] = addresses.DEPLOYER;
  replacements[`${addresses.DEPLOYER.split(".")[0]}/origin_address`] =
    addresses.DEPLOYER; // Matches the toReplace from error

  // Add specific contract name aliases if they differ from standard generation
  // These are based on the UnknownKeyName errors for specific templates
  const faktoryDexContractName = CONTRACT_NAMES["TOKEN"]["DEX"].replace(
    templateKeySymbol,
    symbol
  );
  replacements["dao_contract_faktory_dex"] = `.${faktoryDexContractName}`;
  replacements[
    `.${CONTRACT_NAMES["TOKEN"]["DEX"]}/dao_contract_faktory_dex`
  ] = `.${faktoryDexContractName}`;

  const preFaktoryContractName = CONTRACT_NAMES["TOKEN"]["PRELAUNCH"].replace(
    templateKeySymbol,
    symbol
  );
  replacements["dao_contract_pre_faktory"] = `.${preFaktoryContractName}`;
  replacements[
    `.${CONTRACT_NAMES["TOKEN"]["PRELAUNCH"]}/dao_contract_pre_faktory`
  ] = `.${preFaktoryContractName}`;

  // Add faktory_dex_trait (Note: This trait is not in KnownTraits.ts, using literal value from error for devnet/testnet)
  // Ideally, this should be added to KnownTraits for proper multi-network support.
  const faktoryDexTraitValue =
    network === "mainnet"
      ? "MAINNET_FAKTORY_DEX_TRAIT_PLACEHOLDER"
      : "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-dex-trait-v1-1.dex-trait";
  replacements["faktory_dex_trait"] = `'${faktoryDexTraitValue}'`;
  replacements[
    `${faktoryDexTraitValue}/faktory_dex_trait`
  ] = `'${faktoryDexTraitValue}'`;

  // 6. Add DAO manifest
  replacements[
    `${templateKeySymbol} mission goes here/dao_manifest`
  ] = `The mission of the ${symbol} is to...`; // Adjusted to use templateKeySymbol
  replacements["dao_manifest"] = `The mission of the ${symbol} is to...`;

  // 7. Add agent account specific replacements
  const agentTraitKeys: (keyof KnownTraits)[] = [
    "AGENT_ACCOUNT",
    "AGENT_FAKTORY_DEX_APPROVAL",
    "AGENT_ACCOUNT_PROPOSALS",
    "AGENT_FAKTORY_BUY_SELL",
  ];

  agentTraitKeys.forEach((key) => {
    const traitValue = traits[key];
    if (traitValue) {
      const lowerKey = (key as string).toLowerCase();
      let templateKeyName: string;

      // Ensure correct keyName generation for agent traits
      if (key === "AGENT_ACCOUNT_PROPOSALS") {
        templateKeyName = "agent_account_trait_proposals";
      } else {
        // General case for other agent traits like AGENT_ACCOUNT, AGENT_FAKTORY_DEX_APPROVAL, etc.
        const formattedKey = lowerKey.replace(/^agent_/, ""); // e.g. "account", "faktory_dex_approval"
        templateKeyName = `agent_account_trait_${formattedKey}`;
      }

      replacements[templateKeyName] = `'${traitValue}`;

      // Construct the toReplace pattern based on templateKeySymbol and the specific parts of the agent trait name
      // e.g., for AGENT_ACCOUNT_PROPOSALS -> .aibtc-agent-account-traits.aibtc-proposals
      const traitNameParts = traitValue.split(".");
      if (traitNameParts.length > 0) {
        const lastPart = traitNameParts[traitNameParts.length - 1]; // e.g., aibtc-proposals
        // Assuming agent traits follow a pattern like '.<templateKeySymbol>-agent-account-traits.<specific-part>'
        // The specific part (e.g. "aibtc-proposals") is derived from the known trait string.
        // The "agent-account-traits" part is assumed based on the error messages.
        const toReplacePattern = `.${templateKeySymbol}-agent-account-traits.${lastPart}`;
        replacements[
          `${toReplacePattern}/${templateKeyName}`
        ] = `'${traitValue}`;
      }
    }
  });

  replacements[`${addresses.DEPLOYER.split(".")[0]}/account_owner`] =
    addresses.DEPLOYER; // Adjusted for dynamic deployer prefix
  replacements["account_owner"] = addresses.DEPLOYER;
  // Assuming ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG is a fixed address or needs to be in known-addresses
  const defaultAgentAddress = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
  replacements[`${defaultAgentAddress.split(".")[0]}/account_agent`] =
    defaultAgentAddress;
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
