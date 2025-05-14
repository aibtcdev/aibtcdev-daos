/**
 * AIBTC DAO API Types
 *
 * This package provides TypeScript type definitions for the AIBTC DAO API.
 */

import {
  AddressDependency,
  ContractDependency,
  RuntimeValue,
  TraitDependency,
} from "../../../models/contract-template";
import { ContractType } from "../../../utilities/contract-types";

// Re-export contract types from utilities/contract-types.ts
export type {
  ContractType,
  ContractSubtype,
  AllContractSubtypes,
} from "../../../utilities/contract-types";

// Re-export contract model types from models/contract-template.ts
export type {
  AddressDependency,
  TraitDependency,
  ContractDependency,
  RuntimeValue,
} from "../../../models/contract-template";

/**
 * Contract generation result
 */

export type { DeploymentResult } from "../../../models/contract-template";

// API Response interface
export type { ApiResponse } from "../../../src/utils/response-utils";

// Contract info derived from ContractBase
export interface ContractInfo {
  name: string;
  type: ContractType;
  subtype: string;
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

export interface ContractSourceResponse {
  source: string;
}

export interface GeneratedContractResponse {
  source: string;
  hash: string;
}

// DAO configuration
export interface DaoConfig {
  name: string;
  tokenSymbol: string;
  network: string;
}
