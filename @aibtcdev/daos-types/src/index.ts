/**
 * AIBTC DAO API Types
 * 
 * This package provides TypeScript type definitions for the AIBTC DAO API.
 */

// Re-export contract types from utilities/contract-types.ts
export { ContractType } from '../../utilities/contract-types';
export type { ContractSubtype, AllContractSubtypes } from '../../utilities/contract-types';

// Re-export contract model types from models/contract-template.ts
export type {
  AddressDependency,
  TraitDependency,
  ContractDependency,
  RuntimeValue
} from '../../models/contract-template';

/**
 * Contract generation result
 */
export interface DeploymentResult {
  sender: string;
  success: boolean;
  txId?: string;
  address: string;
  error?: string;
}

// API Response interface
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    id: string;
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// Error codes
export enum ErrorCode {
  // General errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Contract-specific errors
  CONTRACT_NOT_FOUND = 'CONTRACT_NOT_FOUND',
  INVALID_CONTRACT_TYPE = 'INVALID_CONTRACT_TYPE',
  CONTRACT_GENERATION_FAILED = 'CONTRACT_GENERATION_FAILED',
  
  // Deployment errors
  DEPLOYMENT_FAILED = 'DEPLOYMENT_FAILED'
}

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
  dependencies: Array<AddressDependency | TraitDependency | ContractDependency | RuntimeValue>;
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

