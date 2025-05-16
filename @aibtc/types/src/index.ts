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
  ContractBase,
  DeploymentResult,
} from "../../../models/contract-template";

export type {
  AddressDependency,
  TraitDependency,
  ContractDependency,
  RuntimeValue,
  ContractBase,
  DeploymentResult,
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
} from "../../../utilities/contract-types";
import { CONTRACT_NAMES } from "../../../utilities/contract-types";

export type { ContractType, ContractSubtype, AllContractSubtypes };
export { CONTRACT_NAMES };

/**
 * API response types
 * These are used to define the types of responses that can be returned by the API.
 */

// API Response interface
import type { ApiResponse } from "../../../src/utils/response-utils";
export type { ApiResponse };

// API response types for specific endpoints
export interface TypesResponse {
  types: Record<string, string[]>;
}

export type SimpleContractResponse = Pick<
  ContractBase,
  "name" | "displayName" | "type" | "subtype" | "source"
>;

export interface ContractsListResponse {
  contracts: Array<
    Pick<
      ContractBase,
      "name" | "type" | "subtype" | "deploymentOrder" | "isDeployed"
    >
  >;
}

export interface ContractNamesResponse {
  names: string[];
}

export interface ContractDetailResponse {
  contract: Pick<
    ContractBase,
    | "name"
    | "type"
    | "subtype"
    | "templatePath"
    | "deploymentOrder"
    | "isDeployed"
    | "source"
    | "hash"
    | "deploymentResult"
  >;
}

export interface ContractsByTypeResponse {
  type: string;
  contracts: Array<
    Pick<ContractBase, "name" | "subtype" | "deploymentOrder" | "isDeployed">
  >;
}

export interface ContractDependenciesResponse {
  name: string;
  dependencies: {
    addresses: ContractBase["requiredAddresses"];
    traits: ContractBase["requiredTraits"];
    contracts: ContractBase["requiredContractAddresses"];
    runtimeValues: ContractBase["requiredRuntimeValues"];
  };
}

export interface GeneratedContractResponse {
  network: string;
  tokenSymbol: string;
  contract: SimpleContractResponse;
  error?: string;
}

export interface GeneratedDaoContractsResponse {
  network: string;
  tokenSymbol: string;
  contracts: SimpleContractResponse[];
  errors?: Array<{
    name: string;
    error: string;
  }>;
}
