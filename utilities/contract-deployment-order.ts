import {
  CONTRACT_NAMES,
  ContractSubtype,
  ContractType,
} from "./contract-types";

// Helper function to safely access contract names with proper typing
function useContract<T extends ContractType>(
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
  [useContract("AGENT", "AGENT_ACCOUNT")]: 1,

  // token contracts
  [useContract("TOKEN", "DAO")]: 10,
  [useContract("TOKEN", "PRELAUNCH")]: 11,
  [useContract("TOKEN", "POOL")]: 12,
  [useContract("TOKEN", "DEX")]: 13,

  // base dao contract
  [useContract("BASE", "DAO")]: 20,

  // extensions
  [useContract("EXTENSIONS", "TREASURY")]: 30,
  [useContract("EXTENSIONS", "ACTION_PROPOSAL_VOTING")]: 31,
  [useContract("EXTENSIONS", "DAO_CHARTER")]: 32,
  [useContract("EXTENSIONS", "DAO_EPOCH")]: 33,
  [useContract("EXTENSIONS", "ONCHAIN_MESSAGING")]: 34,
  [useContract("EXTENSIONS", "TOKEN_OWNER")]: 35,

  // actions
  [useContract("ACTIONS", "SEND_MESSAGE")]: 40,

  // initialize dao (always last)
  [useContract("PROPOSALS", "INITIALIZE_DAO")]: 50,

  // dao trading adapters
  [useContract("TRADING", "FAKTORY_SBTC")]: 60,
  [useContract("TRADING", "BITFLOW_SBTC")]: 61,
  [useContract("TRADING", "FAKTORY_BUY_AND_DEPOSIT")]: 62,
  [useContract("TRADING", "BITFLOW_BUY_AND_DEPOSIT")]: 63,
};
