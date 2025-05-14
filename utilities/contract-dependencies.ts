import { ContractRegistry } from "./contract-registry";
import { ContractType, ContractSubtype } from "./contract-types";

/**
 * Define dependencies for all DAO contracts
 * @param registry The contract registry instance
 */
export function defineAllDaoContractDependencies(registry: ContractRegistry): void {
  defineBaseDaoContractDependencies(registry);
  defineActionContractDependencies(registry);
  defineExtensionContractDependencies(registry);
  defineProposalContractDependencies(registry);
  defineTokenContractDependencies(registry);
}

/**
 * Define dependencies for Base DAO contracts
 * @param registry The contract registry instance
 */
export function defineBaseDaoContractDependencies(registry: ContractRegistry): void {
  const baseDaoContract = registry.getContract("aibtc-base-dao");
  
  if (baseDaoContract) {
    baseDaoContract
      .addTraitDependency("DAO_BASE", "aibtc-base-dao-trait.aibtc-base-dao")
      .addTraitDependency("DAO_PROPOSAL", "aibtc-dao-traits.proposal")
      .addTraitDependency("DAO_EXTENSION", "aibtc-dao-traits.extension")
      .addRuntimeValue("dao_token_symbol");
  }
}

/**
 * Define dependencies for Action contracts
 * @param registry The contract registry instance
 */
export function defineActionContractDependencies(registry: ContractRegistry): void {
  // Get all action contracts
  const actionContracts = registry.getContractsByType("ACTIONS");
  
  // Define dependencies for each action contract
  actionContracts.forEach(contract => {
    switch (contract.name) {
      case "aibtc-action-send-message":
        contract
          .addTraitDependency("DAO_ACTION", "aibtc-dao-traits.action")
          .addContractDependency("messaging_extension", "EXTENSIONS", "MESSAGING")
          .addRuntimeValue("dao_token_symbol");
        break;
      
      // Add other action contracts as needed
      
      default:
        // Default dependencies for all action contracts
        contract.addRuntimeValue("dao_token_symbol");
        break;
    }
  });
}

/**
 * Define dependencies for Extension contracts
 * @param registry The contract registry instance
 */
export function defineExtensionContractDependencies(registry: ContractRegistry): void {
  // Get all extension contracts
  const extensionContracts = registry.getContractsByType("EXTENSIONS");
  
  // Define dependencies for each extension contract
  extensionContracts.forEach(contract => {
    switch (contract.name) {
      case "aibtc-extension-dao-charter":
        contract
          .addTraitDependency("DAO_EXTENSION", "aibtc-dao-traits.extension")
          .addContractDependency("dao", "BASE", "DAO")
          .addRuntimeValue("dao_token_symbol");
        break;
      
      case "aibtc-extension-messaging":
        contract
          .addTraitDependency("DAO_EXTENSION", "aibtc-dao-traits.extension")
          .addContractDependency("dao", "BASE", "DAO")
          .addRuntimeValue("dao_token_symbol");
        break;
      
      // Add other extension contracts as needed
      
      default:
        // Default dependencies for all extension contracts
        contract
          .addTraitDependency("DAO_EXTENSION", "aibtc-dao-traits.extension")
          .addContractDependency("dao", "BASE", "DAO")
          .addRuntimeValue("dao_token_symbol");
        break;
    }
  });
}

/**
 * Define dependencies for Proposal contracts
 * @param registry The contract registry instance
 */
export function defineProposalContractDependencies(registry: ContractRegistry): void {
  // Get all proposal contracts
  const proposalContracts = registry.getContractsByType("PROPOSALS");
  
  // Define dependencies for each proposal contract
  proposalContracts.forEach(contract => {
    switch (contract.name) {
      case "aibtc-proposal-voting":
        contract
          .addTraitDependency("DAO_PROPOSAL", "aibtc-dao-traits.proposal")
          .addContractDependency("dao", "BASE", "DAO")
          .addContractDependency("token", "TOKEN", "DAO")
          .addRuntimeValue("dao_token_symbol");
        break;
      
      case "aibtc-proposal-initialize-dao":
        contract
          .addTraitDependency("DAO_PROPOSAL", "aibtc-dao-traits.proposal")
          .addContractDependency("dao", "BASE", "DAO")
          .addContractDependency("extension_dao_charter", "EXTENSIONS", "CHARTER")
          .addContractDependency("extension_messaging", "EXTENSIONS", "MESSAGING")
          .addRuntimeValue("dao_token_symbol");
        break;
      
      // Add other proposal contracts as needed
      
      default:
        // Default dependencies for all proposal contracts
        contract
          .addTraitDependency("DAO_PROPOSAL", "aibtc-dao-traits.proposal")
          .addContractDependency("dao", "BASE", "DAO")
          .addRuntimeValue("dao_token_symbol");
        break;
    }
  });
}

/**
 * Define dependencies for Token contracts
 * @param registry The contract registry instance
 */
export function defineTokenContractDependencies(registry: ContractRegistry): void {
  // Get all token contracts
  const tokenContracts = registry.getContractsByType("TOKEN");
  
  // Define dependencies for each token contract
  tokenContracts.forEach(contract => {
    switch (contract.name) {
      case "aibtc-token-dao":
        contract
          .addTraitDependency("STANDARD_SIP010", "sip-010-trait-ft-standard.sip-010-trait")
          .addRuntimeValue("dao_token_symbol")
          .addRuntimeValue("dao_token_name")
          .addRuntimeValue("dao_token_decimals");
        break;
      
      case "aibtc-token-dex":
        contract
          .addContractDependency("token", "TOKEN", "DAO")
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
