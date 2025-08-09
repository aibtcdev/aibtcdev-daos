export type FaktoryContractStatus = {
  "is-distribution-period": boolean;
  "total-users": bigint;
  "total-seats-taken": bigint;
  "deployment-height": bigint;
  "distribution-height": bigint;
  "accelerated-vesting": boolean;
  "market-open": boolean;
  "governance-active": boolean;
  "seat-holders": { owner: string; seats: bigint }[];
};

export type FaktoryUserInfo = {
  "seats-owned": bigint;
  "amount-claimed": bigint;
  "claimable-amount": bigint;
};

export type FaktoryUserExpectedShare = {
  user: string;
  "user-seats": bigint;
  "total-seats": bigint;
  "total-accumulated-fees": bigint;
  "expected-share": bigint;
};

export type FaktoryDexInInfo = {
  "total-stx": bigint;
  "total-stk": bigint;
  "ft-balance": bigint;
  k: bigint;
  fee: bigint;
  "stx-in": bigint;
  "new-stk": bigint;
  "new-ft": bigint;
  "tokens-out": bigint;
  "new-stx": bigint;
  "stx-to-grad": bigint;
};

export type AgentAccountSwapAdapterContractInfo = {
  self: string;
  deployedBurnBlock: bigint;
  deployedStacksBlock: bigint;
  swapContract: string;
  daoToken: string;
  bitflowCore?: string; // core calls pool in Bitflow adapter
};

export type AgentAccountSwapAdapterSwapInfo = {
  totalBuys: bigint;
  totalSells: bigint;
  totalSwaps: bigint;
};
