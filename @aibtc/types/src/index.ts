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
  ContractResponse,
} from "../../../models/contract-template";

export type {
  AddressDependency,
  TraitDependency,
  ContractDependency,
  RuntimeValue,
  ContractBase,
  ContractResponse,
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
import {
  CONTRACT_NAMES,
  CONTRACT_TYPES,
  CONTRACT_SUBTYPES,
} from "../../../utilities/contract-types";

export type { ContractType, ContractSubtype, AllContractSubtypes };
export { CONTRACT_NAMES, CONTRACT_TYPES, CONTRACT_SUBTYPES };

/**
 * API response types
 * These are used to define the types of responses that can be returned by the API.
 */

import type { ApiResponse } from "../../../src/utils/response-utils";
export type { ApiResponse };

export interface ContractTypesResponse {
  types: Record<string, string[]>;
}

export interface ContractsListResponse {
  contracts: Array<ContractResponse>;
}

export interface ContractNamesResponse {
  names: string[];
}

export interface ContractDetailResponse {
  contract: ContractResponse;
}

export interface ContractsByTypeResponse {
  type: string;
  contracts: Array<ContractResponse>;
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
  contract: ContractResponse;
  error?: string;
}

export interface GeneratedDaoContractsResponse {
  network: string;
  tokenSymbol: string;
  contracts: Array<ContractResponse>;
  errors?: Array<{
    name: string;
    error: string;
  }>;
}

/**
 * Clarity Contract Error Codes
 * Provides access to Clarity smart contract error codes and their descriptions.
 */
import * as ClarityContractErrorEnums from "./clarity-contract-errors";
import type { EnrichedErrorCodeDetail } from "./contract-error-service";
import {
  getAllErrorDetails,
  getErrorsByContractDetails,
  findErrorDetails,
  getErrorDescription,
} from "./contract-error-service";

export type { EnrichedErrorCodeDetail };
export {
  ClarityContractErrorEnums,
  getAllErrorDetails,
  getErrorsByContractDetails,
  findErrorDetails,
  getErrorDescription,
};

/**
 * Clarity Helpers
 * Provides utility functions for working with Clarity values, such as formatting serialized buffers.
 */
import { formatSerializedBuffer } from "./clarity-helpers";
export { formatSerializedBuffer };

/**
 * Proposal Status Types
 * These types are used to represent the status of a proposal in the AIBTC DAO.
 */
import type { ProposalInputParams, ProposalStatus } from "./proposal-status";
import {
  getProposalStatus,
  PROPOSAL_STATUSES,
  verifyProposalInputParams,
  isProposalStatus,
} from "./proposal-status";

export type { ProposalInputParams, ProposalStatus };
export {
  getProposalStatus,
  PROPOSAL_STATUSES,
  verifyProposalInputParams,
  isProposalStatus,
};

/**
 * Agent Account Types
 * These types are used for interacting with the AIBTC Agent Account contract.
 */
import type {
  AgentAccountApprovalType,
  AgentAccountConfiguration,
  AgentAccountApprovalTypes,
  AgentAccountPermissions,
} from "./agent-account-types";
import {
  AGENT_ACCOUNT_APPROVAL_TYPES,
  getAgentAccountApprovalType,
  AGENT_ACCOUNT_DEFAULT_PERMISSIONS,
  getAgentAccountDefaultPermissions,
  AGENT_ACCOUNT_DEFAULT_DEPLOYER,
  getAgentAccountDefaultDeployer,
} from "./agent-account-types";

export type {
  AgentAccountApprovalType,
  AgentAccountConfiguration,
  AgentAccountApprovalTypes,
  AgentAccountPermissions,
};
export {
  AGENT_ACCOUNT_APPROVAL_TYPES,
  getAgentAccountApprovalType,
  AGENT_ACCOUNT_DEFAULT_PERMISSIONS,
  getAgentAccountDefaultPermissions,
  AGENT_ACCOUNT_DEFAULT_DEPLOYER,
  getAgentAccountDefaultDeployer,
};
