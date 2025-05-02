export type DaoContractAddresses = keyof typeof DEPLOYMENT_ORDER;

export const DEPLOYMENT_ORDER = {
  // separate from dao deployment
  // can be deployed anytime
  "aibtc-agent-account": 1,
  // token contracts
  "aibtc-pre-faktory": 10,
  "aibtc-faktory": 11,
  "xyk-pool-sbtc-aibtc-v-1-1": 12,
  "aibtc-faktory-dex": 13,
  // base dao contract
  "aibtc-base-dao": 20,
  // extensions
  "aibtc-action-proposal-voting": 30,
  "aibtc-dao-charter": 31,
  "aibtc-dao-epoch": 32,
  "aibtc-dao-users": 33,
  "aibtc-onchain-messaging": 34,
  "aibtc-rewards-account": 35,
  "aibtc-token-owner": 36,
  "aibtc-treasury": 37,
  // actions
  "aibtc-action-send-message": 40,
  // initialize dao (always last)
  "aibtc-initialize-dao": 50,
} as const;
