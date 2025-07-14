import { describe } from "vitest";
import { setupFullContractRegistry } from "../../../../utilities/contract-registry";

// setup contract info for tests
const registry = setupFullContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "TRADING",
  "FAKTORY_SBTC"
);
const contractName = contractAddress.split(".")[1];

// DAO contract references
const daoTokenAddress = registry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "DAO"
);

// import error codes
// TODO

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // buy-dao-token() tests
  ////////////////////////////////////////
  // buy-dao-token() fails if token contract does not match
  // buy-dao-token() fails if minReceive is provided and slippage too high
  // buy-dao-token() succeeds and swaps for tx-sender without minReceive
  // buy-dao-token() succeeds and swaps for tx-sender with minReceive
  ////////////////////////////////////////
  // sell-dao-token() tests
  ////////////////////////////////////////
  // sell-dao-token() fails if token contract does not match
  // sell-dao-token() fails if minReceive is provided and slippage too high
  // sell-dao-token() succeeds and swaps for tx-sender without minReceive
  // sell-dao-token() succeeds and swaps for tx-sender with minReceive
});

describe(`read-only functions: ${contractName}`, () => {
  // get-contract-info() returns correct contract info
  // get-swap-info() returns correct swap info
});
