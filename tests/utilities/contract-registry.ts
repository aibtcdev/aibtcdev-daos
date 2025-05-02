import { BaseContractInfo } from "./contract-types";
import { BASE_CONTRACTS } from "./registry/base";

export const CONTRACT_REGISTRY: BaseContractInfo[] = [
  ...BASE_CONTRACTS,
  ...BOOTSTRAP_PROPOSAL,
  ...TOKEN_CONTRACTS,
  ...EXTENSION_CONTRACTS,
  ...ACTION_CONTRACTS,
] as const;
