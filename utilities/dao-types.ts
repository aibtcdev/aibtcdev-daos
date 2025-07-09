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
