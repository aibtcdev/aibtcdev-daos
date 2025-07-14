import { Cl, cvToValue } from "@stacks/transactions";
import { describe, expect, it, test } from "vitest";
import { setupFullContractRegistry } from "../../../../utilities/contract-registry";
import { ErrCodeFaktorySwapAdapter } from "../../../../utilities/contract-error-codes";
import {
  getSbtcFromFaucet,
  getDaoTokens,
} from "../../../../utilities/dao-helpers";
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
  ////////////////////////////////////////
  // buy-dao-token() tests
  ////////////////////////////////////////
  it("buy-dao-token() fails if token contract does not match", () => {
    // Arrange
    completePrelaunch(deployer);
    getDaoTokens(deployer, 10000);
    // Act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-dao-token",
      [Cl.principal(tokenDexContractAddress), Cl.uint(1000), Cl.none()],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_DAO_TOKEN));
  });

  it("buy-dao-token() fails if minReceive is provided and slippage is too high", () => {
    // Arrange
    completePrelaunch(deployer);
    getDaoTokens(deployer, 10000);
    // Act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-dao-token",
      [
        Cl.principal(daoTokenAddress),
        Cl.uint(1000),
        Cl.some(Cl.uint(1_000_000_000)),
      ],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_SLIPPAGE_TOO_HIGH));
  });

  it("buy-dao-token() succeeds and swaps for tx-sender without minReceive", () => {
    // Arrange
    completePrelaunch(deployer);
    getDaoTokens(deployer, 10000);
    // Act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-dao-token",
      [Cl.principal(daoTokenAddress), Cl.uint(100000), Cl.none()],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("buy-dao-token() succeeds and swaps for tx-sender with minReceive", () => {
    // Arrange
    completePrelaunch(deployer);
    getDaoTokens(deployer, 10000);
    // Act
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
    // Arrange
    completePrelaunch(deployer);
    getDaoTokens(deployer, 10000);
    // Act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "sell-dao-token",
      [Cl.principal(tokenDexContractAddress), Cl.uint(1000), Cl.none()],
      deployer
    );
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_DAO_TOKEN));
  });

  it("sell-dao-token() succeeds and swaps for tx-sender without minReceive", () => {
    // Arrange
    completePrelaunch(deployer);
    getDaoTokens(deployer, 10000);
    // Act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "sell-dao-token",
      [Cl.principal(daoTokenAddress), Cl.uint(100000), Cl.none()],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("sell-dao-token() succeeds and swaps for tx-sender with minReceive", () => {
    // Arrange
    completePrelaunch(deployer);
    getDaoTokens(deployer, 10000);
    // Act
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
  test("get-contract-info() returns correct contract info", () => {
    // Arrange
    const daoTokenAddress = registry.getContractAddressByTypeAndSubtype(
      "TOKEN",
      "DAO"
    );
    const tokenDexContractAddress = registry.getContractAddressByTypeAndSubtype(
      "TOKEN",
      "DEX"
    );

    // Act
    const info = simnet.callReadOnlyFn(
      contractAddress,
      "get-contract-info",
      [],
      deployer
    );

    // Assert
    const result = cvToValue(info.result);
    expect(result.self.value).toBe(contractAddress);
    expect(result.faktoryDex.value).toBe(tokenDexContractAddress);
    expect(result.daoToken.value).toBe(daoTokenAddress);
  });

  test("get-swap-info() returns correct swap info", () => {
    // Act
    const info = simnet.callReadOnlyFn(
      contractAddress,
      "get-swap-info",
      [],
      deployer
    );
    // Assert
    const result = cvToValue(info.result);
    expect(result.totalBuys.value).toBe(0n);
    expect(result.totalSells.value).toBe(0n);
    expect(result.totalSwaps.value).toBe(0n);
  });
});
