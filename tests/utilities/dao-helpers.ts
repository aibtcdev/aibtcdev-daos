import { expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { SBTC_CONTRACT } from "./contract-helpers";
import { dbgLog } from "./debug-logging";

// helper to get sBTC from faucet and buy DAO tokens from the token dex
export function getDaoTokens(
  tokenContractAddress: string,
  tokenDexContractAddress: string,
  address: string,
  satsAmount: number
) {
  // get sbtc from the faucet
  const faucetReceipt = simnet.callPublicFn(
    SBTC_CONTRACT,
    "faucet",
    [],
    address
  );
  expect(faucetReceipt.result).toBeOk(Cl.bool(true));
  // get dao tokens from the token dex
  const getDaoTokensReceipt = simnet.callPublicFn(
    tokenDexContractAddress,
    "buy",
    [Cl.principal(tokenContractAddress), Cl.uint(satsAmount)],
    address
  );
  dbgLog(`getDaoTokensReceipt: ${JSON.stringify(getDaoTokensReceipt)}`);
  expect(getDaoTokensReceipt.result).toBeOk(Cl.bool(true));
  // progress chain for at-block calls
  simnet.mineEmptyBlocks(10);
}

// helper to fund voters with random amounts of DAO tokens for voting on proposals
export function fundVoters(
  tokenContractAddress: string,
  tokenDexContractAddress: string,
  voters: string[]
) {
  for (const voter of voters) {
    // generate an amount between 100k and 1M satoshis
    const btcAmount =
      Math.floor(Math.random() * (1000000 - 100000 + 1)) + 100000;
    // get dao tokens from the token dex
    const getDaoTokensReceipt = simnet.callPublicFn(
      tokenDexContractAddress,
      "buy",
      [Cl.principal(tokenContractAddress), Cl.uint(btcAmount)],
      voter
    );
    dbgLog(`getDaoTokensReceipt: ${JSON.stringify(getDaoTokensReceipt)}`);
    expect(getDaoTokensReceipt.result).toBeOk(Cl.bool(true));
    // progress chain for at-block calls
    simnet.mineEmptyBlocks(10);
  }
}

// helper to construct a DAO so proposals can be created/executed
export function constructDao(
  deployer: string,
  baseDaoContractAddress: string,
  bootstrapContractAddress: string
) {
  const constructDaoReceipt = simnet.callPublicFn(
    baseDaoContractAddress,
    "construct",
    [Cl.principal(bootstrapContractAddress)],
    deployer
  );
  expect(constructDaoReceipt.result).toBeOk(Cl.bool(true));
  // progress chain for at-block calls
  simnet.mineEmptyBlocks(10);
}

// helper to pass an action proposal
const memoContext = "Can pass up to 1024 characters for additional context.";
export function passActionProposal() {
  dbgLog(memoContext); // TODO: fill in when needed from test
}
