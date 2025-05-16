/**
 * AIBTC DAO API Types
 *
 * This package provides TypeScript type definitions for the AIBTC DAO API.
 */

/**
 * Contract template dependencies
 * These are used to define the dependencies of a contract template.
 * They can be addresses, traits, or other contracts.
 * The dependencies are used to generate the contract and its deployment.
 */
import type {
  AddressDependency,
  ContractDependency,
  RuntimeValue,
  TraitDependency,
} from "../models/contract-template";

export type {
  AddressDependency,
  TraitDependency,
  ContractDependency,
  RuntimeValue,
};

/**
 * Contract types and subtypes
 * These are used to define the types of contracts that can be generated.
 * The types are used to generate the contract and its deployment.
 * The subtypes are used to define the specific type of contract.
 */
import type {
  ContractType,
  ContractSubtype,
  AllContractSubtypes,
} from "../utilities/contract-types";
import { CONTRACT_NAMES } from "../utilities/contract-types";

export type { ContractType, ContractSubtype, AllContractSubtypes };
export { CONTRACT_NAMES };

/**
 * API response types
 * These are used to define the types of responses that can be returned by the API.
 */

// API Response interface
import type { ApiResponse } from "../src/utils/response-utils";
export type { ApiResponse };

// Contract info derived from ContractBase
export interface ContractInfo {
  name: string;
  type: ContractType;
  subtype: ContractSubtype<ContractType>;
  deploymentOrder: number;
  templatePath: string;
  source?: string;
  hash?: string;
}

// API response types for specific endpoints
export interface ContractsListResponse {
  contracts: ContractInfo[];
}

export interface ContractDetailResponse {
  contract: ContractInfo;
}

export interface ContractDependenciesResponse {
  dependencies: Array<
    AddressDependency | TraitDependency | ContractDependency | RuntimeValue
  >;
}

// DAO configuration
export interface DaoConfig {
  name: string;
  tokenSymbol: string;
  network: string;
}
