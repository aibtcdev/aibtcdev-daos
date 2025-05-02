import { DEPLOYMENT_ORDER } from "../contract-deployment-order";
import { BaseContractInfo } from "../contract-types";

// Base DAO contracts
export const BASE_CONTRACTS: BaseContractInfo[] = [
  {
    name: "aibtc-base-dao",
    type: "BASE",
    subtype: "DAO",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-base-dao"],
    clarityVersion: 3,
  },
  {
    name: "aibtc-agent-account",
    type: "BASE",
    subtype: "AGENT_ACCOUNT",
    deploymentOrder: DEPLOYMENT_ORDER["aibtc-agent-account"],
    clarityVersion: 3,
  },
];
