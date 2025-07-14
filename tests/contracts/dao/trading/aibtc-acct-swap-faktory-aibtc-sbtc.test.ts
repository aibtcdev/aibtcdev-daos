import { Cl } from "@stacks/transactions";
import { describe, expect, it, beforeEach } from "vitest";
import { setupFullContractRegistry } from "../../../../utilities/contract-registry";
import { ErrCodeFaktorySwapAdapter } from "../../../../utilities/contract-error-codes";
import { getSbtcFromFaucet, getDaoTokens } from "../../../../utilities/dao-helpers";
import { completePrelaunch } from "../../../../utilities/dao-helpers";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

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
const tokenDexContractAddress = registry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "DEX"
);

// import error codes
const ErrCode = ErrCodeFaktorySwapAdapter;

describe(`public functions: ${contractName}`, () => {
  beforeEach(() => {
    // get sBTC and DAO tokens for the deployer
    completePrelaunch(deployer);
    getSbtcFromFaucet(deployer);
    getDaoTokens(deployer, 100000000); // 1 BTC worth
  });

  ////////////////////////////////////////
  // buy-dao-token() tests
  ////////////////////////////////////////
  it("buy-dao-token() fails if token contract does not match", () => {
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-dao-token",
      [Cl.principal(tokenDexContractAddress), Cl.uint(1000), Cl.none()],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_DAO_TOKEN));
  });

  it("buy-dao-token() fails if minReceive is provided and slippage is too high", () => {
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-dao-token",
      [Cl.principal(daoTokenAddress), Cl.uint(1000), Cl.some(Cl.uint(1_000_000_000))],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_SLIPPAGE_TOO_HIGH));
  });

  it("buy-dao-token() succeeds and swaps for tx-sender without minReceive", () => {
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-dao-token",
      [Cl.principal(daoTokenAddress), Cl.uint(100000), Cl.none()],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("buy-dao-token() succeeds and swaps for tx-sender with minReceive", () => {
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-dao-token",
      [Cl.principal(daoTokenAddress), Cl.uint(100000), Cl.some(Cl.uint(1))],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  ////////////////////////////////////////
  // sell-dao-token() tests
  ////////////////////////////////////////
  it("sell-dao-token() fails if token contract does not match", () => {
    const receipt = simnet.callPublicFn(
      contractAddress,
      "sell-dao-token",
      [Cl.principal(tokenDexContractAddress), Cl.uint(1000), Cl.none()],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_DAO_TOKEN));
  });

  it("sell-dao-token() succeeds and swaps for tx-sender without minReceive", () => {
    const receipt = simnet.callPublicFn(
      contractAddress,
      "sell-dao-token",
      [Cl.principal(daoTokenAddress), Cl.uint(100000), Cl.none()],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("sell-dao-token() succeeds and swaps for tx-sender with minReceive", () => {
    const receipt = simnet.callPublicFn(
      contractAddress,
      "sell-dao-token",
      [Cl.principal(daoTokenAddress), Cl.uint(100000), Cl.some(Cl.uint(1))],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
});

describe(`read-only functions: ${contractName}`, () => {
  // get-contract-info() returns correct contract info
  // get-swap-info() returns correct swap info
});
