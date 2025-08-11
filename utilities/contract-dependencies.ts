import { ContractRegistry } from "./contract-registry";

/**
 * Define dependencies for all DAO contracts
 * @param registry The contract registry instance
 */
export function defineAllDaoContractDependencies(
  registry: ContractRegistry
): void {
  defineBaseDaoContractDependencies(registry);
  defineActionContractDependencies(registry);
  defineExtensionContractDependencies(registry);
  defineProposalContractDependencies(registry);
  defineTokenContractDependencies(registry);
  defineAgentContractDependencies(registry);
  defineTradingContractDependencies(registry);
}

/**
 * Define dependencies for Base DAO contracts
 * @param registry The contract registry instance
 */
export function defineBaseDaoContractDependencies(
  registry: ContractRegistry
): void {
  const baseDaoContract = registry.getContract("aibtc-base-dao");

  if (baseDaoContract) {
    baseDaoContract
      .addTraitDependency("DAO_BASE", "dao_trait_base")
      .addTraitDependency("DAO_PROPOSAL", "dao_trait_proposal")
      .addTraitDependency("DAO_EXTENSION", "dao_trait_extension")
      .addRuntimeValue("dao_token_symbol");
  }
}

/**
 * Define dependencies for Action contracts
 * @param registry The contract registry instance
 */
export function defineActionContractDependencies(
  registry: ContractRegistry
): void {
  // Get all action contracts
  const actionContracts = registry.getContractsByType("ACTIONS");

  // Define dependencies for each action contract
  actionContracts.forEach((contract) => {
    switch (contract.name) {
      case "aibtc-action-send-message":
        contract
          .addTraitDependency("DAO_EXTENSION", "dao_trait_extension")
          .addTraitDependency("DAO_ACTION", "dao_trait_action")
          .addContractDependency(
            "dao_contract_messaging",
            "EXTENSIONS",
            "ONCHAIN_MESSAGING"
          )
          .addContractDependency("dao_contract_base", "BASE", "DAO")
          .addRuntimeValue("dao_token_symbol");
        break;

      // Add other action contracts as needed

      default:
        // Default dependencies for all action contracts
        contract.addRuntimeValue("dao_token_symbol");
        break;

      // Add other action contracts as needed
    }
  });
}

/**
 * Define dependencies for Extension contracts
 * @param registry The contract registry instance
 */
export function defineExtensionContractDependencies(
  registry: ContractRegistry
): void {
  // Get all extension contracts
  const extensionContracts = registry.getContractsByType("EXTENSIONS");

  // Define dependencies for each extension contract
  extensionContracts.forEach((contract) => {
    switch (contract.name) {
      case "aibtc-dao-charter":
        contract
          .addTraitDependency("DAO_EXTENSION", "dao_trait_extension")
          .addTraitDependency("DAO_CHARTER", "dao_trait_charter")
          .addContractDependency("dao_contract_base", "BASE", "DAO")
          .addRuntimeValue("dao_token_symbol");
        break;

      case "aibtc-onchain-messaging":
        contract
          .addTraitDependency("DAO_EXTENSION", "dao_trait_extension")
          .addTraitDependency("DAO_MESSAGING", "dao_trait_messaging")
          .addContractDependency("dao_contract_base", "BASE", "DAO")
          .addContractDependency("dao_contract_token", "TOKEN", "DAO")
          .addContractDependency(
            "dao_contract_treasury",
            "EXTENSIONS",
            "TREASURY"
          )
          .addContractDependency(
            "dao_contract_action_proposal_voting",
            "EXTENSIONS",
            "ACTION_PROPOSAL_VOTING"
          )
          .addRuntimeValue("dao_token_symbol");
        break;

      case "aibtc-action-proposal-voting":
        contract
          .addTraitDependency("DAO_EXTENSION", "dao_trait_extension")
          .addTraitDependency(
            "DAO_ACTION_PROPOSAL_VOTING",
            "dao_trait_action_proposal_voting"
          )
          .addTraitDependency("DAO_ACTION", "dao_trait_action")
          .addAddressDependency("AIBTC_RUN_COST", "base_contract_dao_run_cost")
          .addContractDependency(
            "dao_contract_rewards_account",
            "EXTENSIONS",
            "REWARDS_ACCOUNT"
          )
          .addContractDependency(
            "dao_contract_treasury",
            "EXTENSIONS",
            "TREASURY"
          )
          .addContractDependency(
            "dao_contract_users",
            "EXTENSIONS",
            "DAO_USERS"
          )
          .addContractDependency("dao_contract_token", "TOKEN", "DAO")
          .addContractDependency("dao_contract_base", "BASE", "DAO")
          .addRuntimeValue("dao_token_symbol");
        break;

      case "aibtc-dao-users":
        contract
          .addTraitDependency("DAO_EXTENSION", "dao_trait_extension")
          .addTraitDependency("DAO_USERS", "dao_trait_users")
          .addContractDependency("dao_contract_base", "BASE", "DAO")
          .addRuntimeValue("dao_token_symbol");
        break;

      case "aibtc-rewards-account":
        contract
          .addTraitDependency("DAO_EXTENSION", "dao_trait_extension")
          .addTraitDependency(
            "DAO_REWARDS_ACCOUNT",
            "dao_trait_rewards_account"
          )
          .addTraitDependency("BASE_SIP010", "base_trait_sip010")
          .addContractDependency("dao_contract_base", "BASE", "DAO")
          .addContractDependency("dao_contract_token", "TOKEN", "DAO")
          .addRuntimeValue("dao_token_symbol");
        break;

      case "aibtc-treasury":
        contract
          .addTraitDependency("DAO_EXTENSION", "dao_trait_extension")
          .addTraitDependency("DAO_TREASURY", "dao_trait_treasury")
          .addTraitDependency("BASE_SIP010", "base_trait_sip010")
          .addContractDependency("dao_contract_base", "BASE", "DAO")
          .addRuntimeValue("dao_token_symbol");
        break;

      case "aibtc-token-owner":
        contract
          .addTraitDependency("DAO_EXTENSION", "dao_trait_extension")
          .addTraitDependency("DAO_TOKEN_OWNER", "dao_trait_token_owner")
          .addContractDependency("dao_contract_token", "TOKEN", "DAO")
          .addContractDependency("dao_contract_base", "BASE", "DAO")
          .addRuntimeValue("dao_token_symbol");
        break;

      case "aibtc-dao-epoch":
        contract
          .addTraitDependency("DAO_EXTENSION", "dao_trait_extension")
          .addTraitDependency("DAO_EPOCH", "dao_trait_epoch")
          .addContractDependency("dao_contract_base", "BASE", "DAO")
          .addRuntimeValue("dao_token_symbol");
        break;

      default:
        // Default dependencies for all extension contracts
        contract
          .addTraitDependency("DAO_EXTENSION", "dao_trait_extension")
          .addContractDependency("dao_contract_base", "BASE", "DAO")
          .addRuntimeValue("dao_token_symbol");
        break;
    }
  });
}

/**
 * Define dependencies for Proposal contracts
 * @param registry The contract registry instance
 */
export function defineProposalContractDependencies(
  registry: ContractRegistry
): void {
  // Get all proposal contracts
  const proposalContracts = registry.getContractsByType("PROPOSALS");

  // Define dependencies for each proposal contract
  proposalContracts.forEach((contract) => {
    switch (contract.name) {
      case "aibtc-base-initialize-dao":
        contract
          .addTraitDependency("DAO_PROPOSAL", "dao_trait_proposal")
          .addContractDependency("dao_contract_base", "BASE", "DAO")
          .addContractDependency("dao_contract_token", "TOKEN", "DAO")
          .addAddressDependency("SBTC", "sbtc_token_contract")
          .addContractDependency(
            "dao_contract_action_proposal_voting",
            "EXTENSIONS",
            "ACTION_PROPOSAL_VOTING"
          )
          .addContractDependency(
            "dao_contract_charter",
            "EXTENSIONS",
            "DAO_CHARTER"
          )
          .addContractDependency(
            "dao_contract_epoch",
            "EXTENSIONS",
            "DAO_EPOCH"
          )
          .addContractDependency(
            "dao_contract_users",
            "EXTENSIONS",
            "DAO_USERS"
          )
          .addContractDependency(
            "dao_contract_messaging",
            "EXTENSIONS",
            "ONCHAIN_MESSAGING"
          )
          .addContractDependency(
            "dao_contract_token_owner",
            "EXTENSIONS",
            "TOKEN_OWNER"
          )
          .addContractDependency(
            "dao_contract_treasury",
            "EXTENSIONS",
            "TREASURY"
          )
          .addContractDependency(
            "dao_action_send_message",
            "ACTIONS",
            "SEND_MESSAGE"
          )
          .addRuntimeValue("dao_token_symbol")
          .addRuntimeValue("dao_manifest");
        break;

      // Add other proposal contracts as needed

      default:
        // Default dependencies for all proposal contracts
        contract
          .addTraitDependency("DAO_PROPOSAL", "dao_trait_proposal")
          .addContractDependency("dao_contract_base", "BASE", "DAO")
          .addRuntimeValue("dao_token_symbol");
        break;
    }
  });
}

/**
 * Define dependencies for Token contracts
 * @param registry The contract registry instance
 */
export function defineTokenContractDependencies(
  registry: ContractRegistry
): void {
  // Get all token contracts
  const tokenContracts = registry.getContractsByType("TOKEN");

  // Define dependencies for each token contract
  tokenContracts.forEach((contract) => {
    switch (contract.name) {
      case "aibtc-faktory":
        contract
          .addContractDependency(
            "dao_contract_treasury",
            "EXTENSIONS",
            "TREASURY"
          )
          .addContractDependency("dao_contract_faktory_dex", "TOKEN", "DEX")
          .addContractDependency(
            "dao_contract_pre_faktory",
            "TOKEN",
            "PRELAUNCH"
          )
          .addTraitDependency("BASE_SIP010", "base_trait_sip010")
          .addContractDependency(
            "dao_contract_token_owner",
            "EXTENSIONS",
            "TOKEN_OWNER"
          )
          .addRuntimeValue("dao_token_symbol")
          .addRuntimeValue("dao_token_name")
          .addRuntimeValue("dao_token_decimals")
          .addRuntimeValue("dao_token_metadata");
        break;

      case "aibtc-faktory-dex":
        contract
          .addContractDependency("dao_contract_token", "TOKEN", "DAO")
          .addContractDependency(
            "dao_contract_token_prelaunch",
            "TOKEN",
            "PRELAUNCH"
          )
          .addContractDependency("dao_contract_token_pool", "TOKEN", "POOL")
          .addTraitDependency("DAO_TOKEN_DEX", "dao_trait_faktory_dex")
          .addTraitDependency("FAKTORY_SIP010", "dao_trait_faktory_sip010")
          .addAddressDependency("SBTC", "base_contract_sbtc")
          .addAddressDependency("BITFLOW_CORE", "external_bitflow_core")
          .addAddressDependency("DEPLOYER", "origin_address")
          .addRuntimeValue("faktory_dex_trait")
          .addRuntimeValue("dao_token_symbol");
        break;

      case "xyk-pool-sbtc-aibtc-v-1-1":
        contract
          .addAddressDependency("BITFLOW_CORE", "bitflow_core_contract")
          .addContractDependency("dao_contract_token_dex", "TOKEN", "DEX")
          .addTraitDependency("BITFLOW_POOL", "bitflow_pool_trait")
          .addTraitDependency("BITFLOW_SIP010", "bitflow_sip010_trait")
          // Add other specific dependencies for xyk-pool if any are discovered later
          .addRuntimeValue("dao_token_symbol"); // Assuming it also uses dao_token_symbol
        break;

      case "aibtc-pre-faktory":
        contract
          .addContractDependency("dao_contract_token", "TOKEN", "DAO")
          .addContractDependency("dao_contract_token_dex", "TOKEN", "DEX")
          .addAddressDependency("SBTC", "base_contract_sbtc")
          .addRuntimeValue("dao_token_symbol");
        break;

      // Add other token contracts as needed

      default:
        // Default dependencies for all token contracts
        contract.addRuntimeValue("dao_token_symbol");
        break;
    }
  });
}

/**
 * Define dependencies for Agent contracts
 * @param registry The contract registry instance
 */
export function defineAgentContractDependencies(
  registry: ContractRegistry
): void {
  // Get all agent contracts
  const agentContracts = registry.getContractsByType("AGENT");

  // Define dependencies for each agent contract
  agentContracts.forEach((contract) => {
    switch (contract.name) {
      case "aibtc-agent-account":
        contract
          .addTraitDependency("AGENT_ACCOUNT", "agent_account_trait_account")
          .addTraitDependency(
            "AGENT_ACCOUNT_PROPOSALS",
            "agent_account_trait_account_proposals"
          )
          .addTraitDependency(
            "AGENT_ACCOUNT_CONFIG",
            "agent_account_trait_account_config"
          )
          .addTraitDependency(
            "AGENT_ACCOUNT_SWAPS",
            "agent_account_trait_account_swaps"
          )
          .addTraitDependency(
            "AGENT_DAO_SWAP_ADAPTER",
            "agent_account_trait_dao_swap_adapter"
          )
          .addTraitDependency("BASE_SIP010", "base_trait_sip010")
          .addTraitDependency("DAO_ACTION", "dao_trait_action")
          .addTraitDependency("DAO_PROPOSAL", "dao_trait_proposal")
          .addTraitDependency(
            "DAO_ACTION_PROPOSAL_VOTING",
            "dao_trait_action_proposal_voting"
          )
          .addTraitDependency("DAO_TOKEN_DEX", "dao_trait_faktory_dex")
          .addTraitDependency("DAO_TOKEN", "dao_trait_faktory_token")
          .addAddressDependency("SBTC", "base_contract_sbtc")
          .addAddressDependency(
            "FAKTORY_REGISTRY",
            "faktory_agent_account_registry"
          )
          .addContractDependency("dao_contract_token", "TOKEN", "DAO")
          .addContractDependency("dao_contract_token_dex", "TOKEN", "DEX")
          .addRuntimeValue("account_owner")
          .addRuntimeValue("account_agent")
          .addRuntimeValue("dao_token_symbol");
        break;

      default:
        // Default dependencies for all agent contracts
        contract.addRuntimeValue("dao_token_symbol");
        break;
    }
  });
}

/**
 * Define dependencies for Trading contracts
 * @param registry The contract registry instance
 */
export function defineTradingContractDependencies(
  registry: ContractRegistry
): void {
  // Get all trading contracts
  const tradingContracts = registry.getContractsByType("TRADING");

  // Define dependencies for each trading contract
  tradingContracts.forEach((contract) => {
    switch (contract.name) {
      case "aibtc-acct-swap-faktory-aibtc-sbtc":
        contract
          .addTraitDependency(
            "AGENT_DAO_SWAP_ADAPTER",
            "agent_account_trait_dao_swap_adapter"
          )
          .addTraitDependency("BASE_SIP010", "base_trait_sip010")
          .addContractDependency("dao_contract_token", "TOKEN", "DAO")
          .addContractDependency("dao_contract_token_dex", "TOKEN", "DEX")
          .addRuntimeValue("dao_token_symbol");
        break;

      case "aibtc-acct-swap-bitflow-aibtc-sbtc":
        contract
          .addTraitDependency(
            "AGENT_DAO_SWAP_ADAPTER",
            "agent_account_trait_dao_swap_adapter"
          )
          .addTraitDependency("BASE_SIP010", "base_trait_sip010")
          .addAddressDependency("SBTC", "base_contract_sbtc")
          .addContractDependency("dao_contract_token", "TOKEN", "DAO")
          .addAddressDependency("BITFLOW_CORE", "external_bitflow_core")
          .addContractDependency("dao_contract_bitflow_pool", "TOKEN", "POOL")
          .addRuntimeValue("dao_token_symbol");
        break;

      default:
        // Default dependencies for all trading contracts
        contract.addRuntimeValue("dao_token_symbol");
        break;
    }
  });
}
