/**
 * AIBTC DAO API Types
 * 
 * This package provides TypeScript type definitions for the AIBTC DAO API.
 */

/**
 * Base API response interface
 */
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

/**
 * Error codes used in API responses
 */
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

/**
 * Contract types supported by the platform
 */
export type ContractType = 
  | "BASE" 
  | "ACTIONS" 
  | "EXTENSIONS" 
  | "PROPOSALS" 
  | "CORE" 
  | "TOKEN" 
  | "AGENT" 
  | "EXTERNAL";

/**
 * Contract information
 */
export interface ContractInfo {
  name: string;
  type: ContractType;
  subtype: string;
  deploymentOrder: number;
  templatePath: string;
  source?: string;
  hash?: string;
  deploymentResult?: DeploymentResult;
}

/**
 * Result of a contract deployment
 */
export interface DeploymentResult {
  sender: string;
  success: boolean;
  txId?: string;
  address: string;
  error?: string;
}

/**
 * Address dependency for contract templates
 */
export interface AddressDependency {
  ref: string;
  key: string;
}

/**
 * Trait dependency for contract templates
 */
export interface TraitDependency {
  ref: string;
  key: string;
}

/**
 * Contract dependency for contract templates
 */
export interface ContractDependency {
  key: string;
  category: ContractType;
  subcategory: string;
}

/**
 * Runtime value for contract templates
 */
export interface RuntimeValue {
  key: string;
  value?: string;
}

/**
 * Response for listing all contracts
 */
export interface ContractsListResponse {
  contracts: ContractInfo[];
}

/**
 * Response for a single contract's details
 */
export interface ContractDetailResponse {
  contract: ContractInfo;
}

/**
 * Response for contract dependencies
 */
export interface ContractDependenciesResponse {
  dependencies: Array<AddressDependency | TraitDependency | ContractDependency | RuntimeValue>;
}

/**
 * Response for contract source code
 */
export interface ContractSourceResponse {
  source: string;
}

/**
 * Response for a generated contract
 */
export interface GeneratedContractResponse {
  source: string;
  hash: string;
}

/**
 * DAO configuration
 */
export interface DaoConfig {
  name: string;
  tokenSymbol: string;
  network: string;
}

/**
 * MCP event types
 */
export enum McpEventType {
  CONTRACT_DEPLOYED = 'CONTRACT_DEPLOYED',
  CONTRACT_GENERATED = 'CONTRACT_GENERATED',
  DAO_INITIALIZED = 'DAO_INITIALIZED'
}

/**
 * MCP event payload
 */
export interface McpEvent<T = any> {
  type: McpEventType;
  timestamp: number;
  data: T;
}
