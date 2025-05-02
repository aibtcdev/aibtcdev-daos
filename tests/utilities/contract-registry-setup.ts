import {
  CONTRACT_NAMES,
  CONTRACT_TYPES,
  ContractSubtype,
  ContractType,
} from "./contract-types";
import { ContractRegistry } from "./contract-registry";
import { BaseContract } from "../models/dao-base-contract";
import { TokenContract } from "../models/dao-token-contract";
import { ExtensionContract } from "../models/dao-extension-contract";
import { ActionContract } from "../models/dao-action-contract";
import { ProposalContract } from "../models/dao-proposal-contract";

export function setupDaoContractRegistry(): ContractRegistry {
  const registry = new ContractRegistry();
  registry.registerDaoContracts();
  return registry;
}

// Create and populate the registry
export function setupFullContractRegistry(): ContractRegistry {
  const registry = new ContractRegistry();
  registry.registerAllDefinedContracts();
  return registry;
}
