import { expect } from "vitest";
import { Cl, ClarityType, ClarityValue, cvToValue } from "@stacks/transactions";
import {
  DAO_TOKEN_ASSETS_MAP,
  DEVNET_DEPLOYER,
  SBTC_ASSETS_MAP,
  SBTC_CONTRACT,
  convertClarityTuple,
} from "./contract-helpers";
import {
  setupDaoContractRegistry,
  setupFullContractRegistry,
} from "./contract-registry";
import { FaktoryContractStatus, FaktoryDexInInfo } from "./dao-types";
import { dbgLog } from "./debug-logging";
import { getBalancesForPrincipal } from "./asset-helpers";

export const VOTING_DELAY = 144;
export const VOTING_PERIOD = 288;

// Create a singleton registry instance for use in helpers
const registry = setupDaoContractRegistry();

// helper to get a random amount between min and max
function getRandomAmount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// helper to get sBTC from the faucet
export function getSbtcFromFaucet(address: string) {
  const faucetReceipt = simnet.callPublicFn(
    SBTC_CONTRACT,
    "faucet",
    [],
    address
  );
  expect(faucetReceipt.result).toBeOk(Cl.bool(true));
}

// helper to get sBTC from faucet and buy DAO tokens from the token dex
export function getDaoTokens(address: string, satsAmount: number) {
  // Get contract references from registry
  const tokenContract = registry.getContractByTypeAndSubtype("TOKEN", "DAO");
  const tokenDexContract = registry.getContractByTypeAndSubtype("TOKEN", "DEX");

  if (!tokenContract || !tokenDexContract) {
    throw new Error("Required token contracts not found in registry");
  }

  // get sbtc from the faucet
  getSbtcFromFaucet(address);

  // get dao tokens from the token dex
  const getDaoTokensReceipt = simnet.callPublicFn(
    `${DEVNET_DEPLOYER}.${tokenDexContract.name}`,
    "buy",
    [
      Cl.principal(`${DEVNET_DEPLOYER}.${tokenContract.name}`),
      Cl.uint(satsAmount),
    ],
    address
  );
  dbgLog(`getDaoTokensReceipt: ${JSON.stringify(getDaoTokensReceipt)}`);
  expect(getDaoTokensReceipt.result).toBeOk(Cl.bool(true));

  // progress chain for at-block calls
  simnet.mineEmptyBlocks(10);
}

// helper to fund voters with random amounts of DAO tokens for voting on proposals
export function fundVoters(voters: string[]) {
  // Get contract references from registry
  const tokenContract = registry.getContractByTypeAndSubtype("TOKEN", "DAO");
  const tokenDexContract = registry.getContractByTypeAndSubtype("TOKEN", "DEX");

  if (!tokenContract || !tokenDexContract) {
    throw new Error("Required token contracts not found in registry");
  }

  for (const voter of voters) {
    // get sbtc from the faucet
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      voter
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));

    // progress chain
    simnet.mineEmptyBlocks(10);

    // generate an amount between 100k and 1M satoshis
    const btcAmount = getRandomAmount(100_000, 1_000_000);
    dbgLog(`btcAmount: ${btcAmount} satoshis`);

    // get dao tokens from the token dex
    getDaoTokens(voter, btcAmount);

    // progress chain for at-block calls
    simnet.mineEmptyBlocks(10);
  }
}

// helper to fund an agent account with random amounts of sBTC and DAO tokens
export function fundAgentAccount(agentAccountContract: string, sender: string) {
  const daoTokenContract = registry.getContractAddressByTypeAndSubtype(
    "TOKEN",
    "DAO"
  );
  const daoTokenDexContract = registry.getContractAddressByTypeAndSubtype(
    "TOKEN",
    "DEX"
  );
  // get sbtc from the faucet
  const faucetReceipt = simnet.callPublicFn(
    SBTC_CONTRACT,
    "faucet",
    [],
    sender
  );
  expect(faucetReceipt.result).toBeOk(Cl.bool(true));
  // generate an amount between 500k and 1M satoshis
  const btcAmount = getRandomAmount(500_000, 1_000_000);
  dbgLog(`btcAmount: ${btcAmount} satoshis`);
  // get dao tokens from the token dex
  const dexReceipt = simnet.callPublicFn(
    daoTokenDexContract,
    "buy",
    [Cl.principal(daoTokenContract), Cl.uint(btcAmount)],
    sender
  );
  expect(dexReceipt.result).toBeOk(Cl.bool(true));
  // deposit sbtc to the agent account
  const sbtcBalance =
    getBalancesForPrincipal(sender).get(SBTC_ASSETS_MAP) || 0n;
  const depositSbtcReceipt = simnet.callPublicFn(
    agentAccountContract,
    "deposit-ft",
    [Cl.principal(SBTC_CONTRACT), Cl.uint(sbtcBalance)],
    sender
  );
  dbgLog(`depositSbtcReceipt: ${JSON.stringify(depositSbtcReceipt)}`);
  expect(depositSbtcReceipt.result).toBeOk(Cl.bool(true));
  // deposit dao tokens to the agent account
  const daoTokenBalance =
    getBalancesForPrincipal(sender).get(DAO_TOKEN_ASSETS_MAP)!;
  const depositTokensReceipt = simnet.callPublicFn(
    agentAccountContract,
    "deposit-ft",
    [Cl.principal(daoTokenContract), Cl.uint(daoTokenBalance)],
    sender
  );
  dbgLog(
    `depositTokensReceipt: ${JSON.stringify(depositTokensReceipt, null, 2)}`
  );
  expect(depositTokensReceipt.result).toBeOk(Cl.bool(true));
}

// helper to construct a DAO so proposals can be created/executed
export function constructDao(deployer: string) {
  // Get contract references from registry
  const baseDaoContract = registry.getContractByTypeAndSubtype("BASE", "DAO");
  const initializeContract = registry.getContractByTypeAndSubtype(
    "PROPOSALS",
    "INITIALIZE_DAO"
  );

  if (!baseDaoContract || !initializeContract) {
    throw new Error("Required DAO contracts not found in registry");
  }

  const constructDaoReceipt = simnet.callPublicFn(
    `${deployer}.${baseDaoContract.name}`,
    "construct",
    [Cl.principal(`${deployer}.${initializeContract.name}`)],
    deployer
  );
  expect(constructDaoReceipt.result).toBeOk(Cl.bool(true));

  // progress chain for at-block calls
  simnet.mineEmptyBlocks(10);
}

// helper to pass an action proposal
export function passActionProposal(
  proposedActionType: "SEND_MESSAGE", // Can be expanded with other action types
  proposalParams: ClarityValue,
  deployer: string,
  sender: string,
  voters: string[],
  memo?: string
) {
  fundVoters(voters);
  // Get contract references from registry
  const actionProposalsContract = registry.getContractByTypeAndSubtype(
    "EXTENSIONS",
    "ACTION_PROPOSAL_VOTING"
  );

  // Get the specific action contract based on the type parameter
  const proposedActionContract = registry.getContractByTypeAndSubtype(
    "ACTIONS",
    proposedActionType
  );

  if (!actionProposalsContract || !proposedActionContract) {
    throw new Error(
      `Required action contracts not found in registry: ${proposedActionType}`
    );
  }

  const actionProposalContractAddress = `${deployer}.${actionProposalsContract.name}`;
  const proposedActionContractAddress = `${deployer}.${proposedActionContract.name}`;

  // Get the current proposal count to determine the new proposal's ID
  const proposalCountResult = simnet.callReadOnlyFn(
    actionProposalContractAddress,
    "get-total-proposals",
    [],
    deployer
  ).result;
  const proposalCount =
    (cvToValue(proposalCountResult).proposalCount.value as bigint) || 0n;
  const proposalId = proposalCount + 1n;

  // create action proposal
  const proposeActionReceipt = simnet.callPublicFn(
    actionProposalContractAddress,
    "create-action-proposal",
    [
      Cl.principal(proposedActionContractAddress),
      formatSerializedBuffer(proposalParams),
      memo ? Cl.some(Cl.stringAscii(memo)) : Cl.none(),
    ],
    sender
  );
  expect(proposeActionReceipt.result).toBeOk(Cl.bool(true));

  // progress past the voting delay
  simnet.mineEmptyBlocks(VOTING_DELAY);

  // vote on the proposal
  for (const voter of voters) {
    const voteReceipt = simnet.callPublicFn(
      actionProposalContractAddress,
      "vote-on-action-proposal",
      [Cl.uint(proposalId), Cl.bool(true)],
      voter
    );
    expect(voteReceipt.result).toBeOk(Cl.bool(true));
  }

  // progress past the voting period and execution delay
  simnet.mineEmptyBlocks(VOTING_PERIOD + VOTING_DELAY + 1);

  // conclude the proposal
  const concludeProposalReceipt = simnet.callPublicFn(
    actionProposalContractAddress,
    "conclude-action-proposal",
    [Cl.uint(proposalId), Cl.principal(proposedActionContractAddress)],
    deployer
  );
  dbgLog(concludeProposalReceipt);
  expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));
}

// helper to format the expected buffer format since stacks 7.X
export function formatSerializedBuffer(value: ClarityValue): ClarityValue {
  const serialized = Cl.serialize(value);
  const buffer = Cl.bufferFromHex(serialized);
  return buffer;
}

// helper to complete the pre-launch by buying all seats
export function completePrelaunch(deployer: string) {
  const preFaktoryAddress = registry.getContractAddressByTypeAndSubtype(
    "TOKEN",
    "PRELAUNCH"
  );
  if (!preFaktoryAddress) {
    throw new Error("Pre-faktory contract not found in registry");
  }

  // Check if prelaunch is already complete using the safe tuple converter
  const statusResult = simnet.callReadOnlyFn(
    preFaktoryAddress,
    "get-contract-status",
    [],
    deployer
  ).result;
  if (
    statusResult.type !== ClarityType.ResponseOk ||
    statusResult.value.type !== ClarityType.Tuple
  ) {
    throw new Error("Failed to get pre-faktory contract status");
  }
  const status = convertClarityTuple<{ "distribution-height": bigint }>(
    statusResult.value
  );

  if (status["distribution-height"] > 0n) {
    return; // Already complete
  }

  const users = [
    "deployer",
    "wallet_1",
    "wallet_2",
    "wallet_3",
    "wallet_4",
    "wallet_5",
    "wallet_6",
    "wallet_7",
    "wallet_8",
    "faucet",
  ];

  // Use 10 wallets to buy all 20 seats
  for (const wallet of users) {
    const userAddress = simnet.getAccounts().get(wallet)!;
    getSbtcFromFaucet(userAddress);
    const buyReceipt = simnet.callPublicFn(
      preFaktoryAddress,
      "buy-up-to",
      [Cl.uint(2)], // Each user buys 2 seats
      userAddress
    );
    expect(buyReceipt.result).toBeOk(Cl.bool(true));
  }

  // Verify distribution was initialized and market is open in pre-faktory
  const finalStatusResult = simnet.callReadOnlyFn(
    preFaktoryAddress,
    "get-contract-status",
    [],
    deployer
  ).result;
  if (
    finalStatusResult.type !== ClarityType.ResponseOk ||
    finalStatusResult.value.type !== ClarityType.Tuple
  ) {
    throw new Error("Failed to get final pre-faktory contract status");
  }
  const finalStatus = convertClarityTuple<{
    "market-open": boolean;
  }>(finalStatusResult.value);
  // Check if the market is open
  expect(finalStatus["market-open"]).toBe(true);
}

// helper to graduate the faktory dex and create the bitflow pool
export function graduateDex(caller: string) {
  // Get contract references from registry
  const tokenContract = registry.getContractAddressByTypeAndSubtype("TOKEN", "DAO");
  const tokenDexContract = registry.getContractAddressByTypeAndSubtype(
    "TOKEN",
    "DEX"
  );

  // 1. Calculate amount needed to graduate
  const getInResult = simnet.callReadOnlyFn(
    tokenDexContract,
    "get-in",
    [Cl.uint(0)],
    caller
  );
  if (
    getInResult.result.type !== ClarityType.ResponseOk ||
    getInResult.result.value.type !== ClarityType.Tuple
  ) {
    throw new Error("Failed to get dex-in info");
  }
  const dexInfo = convertClarityTuple<FaktoryDexInInfo>(
    getInResult.result.value
  );

  // If total-stx is 0, the contract has been graduated and its balances zeroed out.
  if (dexInfo["total-stx"] === 0n) {
    return;
  }

  const amountToGraduate = dexInfo["stx-to-grad"];

  // 2. Check caller balance
  const sbtcBalance =
    getBalancesForPrincipal(caller).get(SBTC_ASSETS_MAP) || 0n;
  if (sbtcBalance < amountToGraduate) {
    throw new Error(
      `Caller ${caller} has insufficient sBTC to graduate DEX. Needs ${amountToGraduate}, has ${sbtcBalance}`
    );
  }

  // 3. Call buy to graduate the dex
  const preFaktoryAddress = registry.getContractAddressByTypeAndSubtype(
    "TOKEN",
    "PRELAUNCH"
  );
  if (!preFaktoryAddress) {
    throw new Error("Pre-faktory contract not found in registry");
  }

  // --- BEFORE LOGGING ---
  dbgLog("--- State Snapshot BEFORE graduateDex buy call ---", {
    forceLog: true,
  });
  const dexOpenBefore = simnet.callReadOnlyFn(
    tokenDexContract,
    "get-open",
    [],
    caller
  );
  const preFaktoryStatusBeforeResult = simnet.callReadOnlyFn(
    preFaktoryAddress,
    "get-contract-status",
    [],
    caller
  );
  if (preFaktoryStatusBeforeResult.result.type === ClarityType.ResponseOk) {
    const status = convertClarityTuple<FaktoryContractStatus>(
      preFaktoryStatusBeforeResult.result.value
    );
    dbgLog(
      `DEX state BEFORE: open=${JSON.stringify(
        dexOpenBefore.result
      )}, bonded (inferred)=${status["accelerated-vesting"]}`,
      { forceLog: true }
    );
    dbgLog(`Pre-faktory status BEFORE: ${JSON.stringify(status, null, 2)}`, {
      forceLog: true,
    });
  }

  const graduateReceipt = simnet.callPublicFn(
    tokenDexContract,
    "buy",
    [Cl.principal(tokenContract), Cl.uint(amountToGraduate)],
    caller
  );
  dbgLog(`Graduate receipt: ${JSON.stringify(graduateReceipt, null, 2)}`, {
    forceLog: true,
  });

  // --- AFTER LOGGING ---
  dbgLog("--- State Snapshot AFTER graduateDex buy call ---", {
    forceLog: true,
  });
  const dexOpenAfter = simnet.callReadOnlyFn(
    tokenDexContract,
    "get-open",
    [],
    caller
  );
  const preFaktoryStatusAfterResult = simnet.callReadOnlyFn(
    preFaktoryAddress,
    "get-contract-status",
    [],
    caller
  );
  if (preFaktoryStatusAfterResult.result.type === ClarityType.ResponseOk) {
    const status = convertClarityTuple<FaktoryContractStatus>(
      preFaktoryStatusAfterResult.result.value
    );
    dbgLog(
      `DEX state AFTER: open=${JSON.stringify(
        dexOpenAfter.result
      )}, bonded (inferred)=${status["accelerated-vesting"]}`,
      { forceLog: true }
    );
    dbgLog(`Pre-faktory status AFTER: ${JSON.stringify(status, null, 2)}`, {
      forceLog: true,
    });
  }

  expect(graduateReceipt.result).toBeOk(Cl.bool(true));
}
