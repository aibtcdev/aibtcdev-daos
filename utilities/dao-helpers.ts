import { expect } from "vitest";
import { Cl, ClarityType, ClarityValue, cvToValue } from "@stacks/transactions";
import { getKnownAddress } from "./known-addresses";
import {
  DAO_TOKEN_ASSETS_MAP,
  DEVNET_DEPLOYER,
  SBTC_ASSETS_MAP,
  SBTC_CONTRACT,
  convertClarityTuple,
} from "./contract-helpers";
import { setupDaoContractRegistry } from "./contract-registry";
import { FaktoryContractStatus, FaktoryDexInInfo } from "./dao-types";
import { dbgLog } from "./debug-logging";
import { getBalancesForPrincipal } from "./asset-helpers";

// single place for all tests so we can assess costs

// from FAST12 Proposal #16 doubled up so close to max
export const PROPOSAL_MESSAGE =
  "I finished the implementation for the latest agent account contract approval process. Agent account contract approvals and revocations now require specifying a type parameter that represents a hardcoded constant in the contract. Following the changes in the contract additional supporting changes were required in the frontend, backend, and agent tooling. Summary of the updates: frontend: updated button style and text, updated modal with approval info, added default type for VOTING; backend: updated API endpoint to accept type from frontend, updated python wrapper for bun tool to accept parameter and pass to bun script; agent tools: updated script to accept type parameter and validate it using @aibtc/types library, added parameter to contract function call. Everything is updated and functional now as evidenced by this contribution being submitted and evaluated. This unlocked the testing flow for the team which was blocked by errors. --- Metadata --- Title: Implement Type Parameter for Agent Account Approvals | Tags: technical update|contract approval|development tools|testing enablement|infrastructure upgrade | Reference:https://x.com/whoabuddydev/status/1947759645394932080";
export const DAO_CHARTER_MESSAGE = "Test";

export const VOTING_DELAY = 12;
export const VOTING_PERIOD = 24;

export const PROPOSAL_QUORUM = 15; // 15%
export const PROPOSAL_THRESHOLD = 66; // 66%
export const PROPOSAL_BOND = 25000000000n; // 250 DAO token, 8 decimals
export const PROPOSAL_REWARD = 100000000000n; // 1000 DAO token, 8 decimals

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
  const tokenContract = registry.getContractAddressByTypeAndSubtype(
    "TOKEN",
    "DAO"
  );
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
  dbgLog("--- State Snapshot BEFORE graduateDex buy call ---");
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
      )}, bonded (inferred)=${status["accelerated-vesting"]}`
    );
    dbgLog(`Pre-faktory status BEFORE: ${status["market-open"]}}`);
  }

  dbgLog(`--- Calling 'buy' to graduate DEX ---`);
  dbgLog(` > DEX Contract: ${tokenDexContract}`);
  dbgLog(` > Token Contract (ft): ${tokenContract}`);
  dbgLog(` > Amount to Graduate (ubtc): ${amountToGraduate}`);
  dbgLog(` > Caller: ${caller}`);
  dbgLog(` > Caller sBTC Balance: ${sbtcBalance}`);

  const graduateReceipt = simnet.callPublicFn(
    tokenDexContract,
    "buy",
    [Cl.principal(tokenContract), Cl.uint(amountToGraduate)],
    caller
  );
  dbgLog(`Graduate receipt: ${JSON.stringify(graduateReceipt, null, 2)}`);

  // --- AFTER LOGGING ---
  dbgLog("--- State Snapshot AFTER graduateDex buy call ---");
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
      )}, bonded (inferred)=${status["accelerated-vesting"]}`
    );
    dbgLog(`Pre-faktory status AFTER: ${status["market-open"]}`);
  }

  expect(graduateReceipt.result).toBeOk(Cl.bool(true));
}

// helper to enable public pool creation in the bitflow core contract
export function enablePublicPoolCreation(caller: string) {
  const coreContractAddress = getKnownAddress("devnet", "BITFLOW_CORE");

  const receipt = simnet.callPublicFn(
    coreContractAddress,
    "set-public-pool-creation",
    [Cl.bool(true)],
    caller
  );
  dbgLog(
    `enablePublicPoolCreation receipt: ${JSON.stringify(receipt, null, 2)}`
  );
  expect(receipt.result).toBeOk(Cl.bool(true));
}
