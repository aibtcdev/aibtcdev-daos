import { CONTRACT_NAMES, ContractSubtype, ContractType } from "./contract-types";

// Helper function to safely access contract names with proper typing
function getContractName<T extends ContractType>(
  category: T, 
  subcategory: ContractSubtype<T>
): string {
  const value = CONTRACT_NAMES[category][subcategory];
  if (!value) {
    throw new Error(`Contract name not found for ${category}.${subcategory}`);
  }
  return value;
}

export const DEPLOYMENT_ORDER: Record<string, number> = {
  // separate from dao deployment
  // can be deployed anytime
  [getContractName("AGENT", "AGENT_ACCOUNT")]: 1,
  
  // core contracts
  [getContractName("CORE", "DAO_RUN_COST")]: 5,
  
  // token contracts
  [getContractName("TOKEN", "PRELAUNCH")]: 10,
  [getContractName("TOKEN", "DAO")]: 11,
  [getContractName("TOKEN", "POOL")]: 12,
  [getContractName("TOKEN", "DEX")]: 13,
  
  // base dao contract
  [getContractName("BASE", "DAO")]: 20,
  
  // extensions
  [getContractName("EXTENSIONS", "ACTION_PROPOSAL_VOTING")]: 30,
  [getContractName("EXTENSIONS", "DAO_CHARTER")]: 31,
  [getContractName("EXTENSIONS", "DAO_EPOCH")]: 32,
  [getContractName("EXTENSIONS", "DAO_USERS")]: 33,
  [getContractName("EXTENSIONS", "ONCHAIN_MESSAGING")]: 34,
  [getContractName("EXTENSIONS", "REWARDS_ACCOUNT")]: 35,
  [getContractName("EXTENSIONS", "TOKEN_OWNER")]: 36,
  [getContractName("EXTENSIONS", "TREASURY")]: 37,
  
  // actions
  [getContractName("ACTIONS", "SEND_MESSAGE")]: 40,
  
  // initialize dao (always last)
  [getContractName("PROPOSALS", "INITIALIZE_DAO")]: 50,
  
  // External contracts can be added as needed
  // These would typically have higher numbers as they're deployed separately
};
