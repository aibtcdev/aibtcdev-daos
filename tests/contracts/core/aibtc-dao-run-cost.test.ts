import { Cl, ClarityType, ClarityValue, cvToValue } from "@stacks/transactions";
import { describe, expect, it, beforeEach } from "vitest";
import { setupFullContractRegistry } from "../../utilities/contract-registry";
import { ErrCodeProtocolFeesAccount } from "../../utilities/contract-error-codes";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;
const address4 = accounts.get("wallet_4")!;
const address5 = accounts.get("wallet_5")!;

// setup contract info for tests
const registry = setupFullContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "CORE",
  "DAO_RUN_COST"
);
const contractName = contractAddress.split(".")[1];

// Import error codes
const ErrCode = ErrCodeProtocolFeesAccount;

// Constants for testing
const SET_OWNER = Cl.uint(1);
const SET_ASSET = Cl.uint(2);
const TRANSFER = Cl.uint(3);
const TEST_NONCE = 1;

// Mock token contract for testing
const mockTokenAddress = `${deployer}.unknown-token`;

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // set-owner() tests
  ////////////////////////////////////////
  it("set-owner() fails if called by non-owner", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-owner",
      [Cl.uint(TEST_NONCE), Cl.principal(address1), Cl.bool(true)],
      address5
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_OWNER));
  });

  it("set-owner() succeeds with sufficient confirmations", () => {
    // arrange
    // First confirmation doesn't complete action
    const receipt1 = simnet.callPublicFn(
      contractAddress,
      "set-owner",
      [Cl.uint(TEST_NONCE), Cl.principal(address5), Cl.bool(true)],
      deployer
    );
    expect(receipt1.result).toBeOk(Cl.bool(false));
    // Second confirmation doesn't complete action
    const receipt2 = simnet.callPublicFn(
      contractAddress,
      "set-owner",
      [Cl.uint(TEST_NONCE), Cl.principal(address5), Cl.bool(true)],
      address1
    );
    expect(receipt2.result).toBeOk(Cl.bool(false));
    // act
    // Third confirmation completes action
    const receipt3 = simnet.callPublicFn(
      contractAddress,
      "set-owner",
      [Cl.uint(TEST_NONCE), Cl.principal(address5), Cl.bool(true)],
      address2
    );
    // assert
    expect(receipt3.result).toBeOk(Cl.bool(true));
    // Verify the new owner was added
    const isOwner = simnet.callReadOnlyFn(
      contractAddress,
      "is-owner",
      [Cl.principal(address3)],
      deployer
    ).result;
    expect(isOwner).toStrictEqual(Cl.bool(true));
  });

  ////////////////////////////////////////
  // set-asset() tests
  ////////////////////////////////////////
  it("set-asset() fails if called by non-owner", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-asset",
      [Cl.uint(TEST_NONCE), Cl.principal(mockTokenAddress), Cl.bool(true)],
      address5
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_OWNER));
  });

  it("set-asset() succeeds with sufficient confirmations", () => {
    // First confirmation doesn't complete action
    const receipt1 = simnet.callPublicFn(
      contractAddress,
      "set-asset",
      [Cl.uint(TEST_NONCE), Cl.principal(mockTokenAddress), Cl.bool(true)],
      deployer
    );
    expect(receipt1.result).toBeOk(Cl.bool(false));
    // Second confirmation doesn't complete action
    const receipt2 = simnet.callPublicFn(
      contractAddress,
      "set-asset",
      [Cl.uint(TEST_NONCE), Cl.principal(mockTokenAddress), Cl.bool(true)],
      address1
    );
    expect(receipt2.result).toBeOk(Cl.bool(false));
    // act
    // Third confirmation completes action
    const receipt3 = simnet.callPublicFn(
      contractAddress,
      "set-asset",
      [Cl.uint(TEST_NONCE), Cl.principal(mockTokenAddress), Cl.bool(true)],
      address2
    );
    expect(receipt3.result).toBeOk(Cl.bool(true));
    // assert
    // Verify the asset was added
    const isAllowed = simnet.callReadOnlyFn(
      contractAddress,
      "is-allowed-asset",
      [Cl.principal(mockTokenAddress)],
      deployer
    ).result;
    expect(isAllowed).toStrictEqual(Cl.bool(true));
  });

  ////////////////////////////////////////
  // transfer-dao-token() tests
  ////////////////////////////////////////
  it("transfer-dao-token() fails if called by non-owner", () => {
    // arrange
    // First confirmation doesn't complete action
    const receipt1 = simnet.callPublicFn(
      contractAddress,
      "set-asset",
      [Cl.uint(TEST_NONCE), Cl.principal(mockTokenAddress), Cl.bool(true)],
      deployer
    );
    expect(receipt1.result).toBeOk(Cl.bool(false));
    // Second confirmation doesn't complete action
    const receipt2 = simnet.callPublicFn(
      contractAddress,
      "set-asset",
      [Cl.uint(TEST_NONCE), Cl.principal(mockTokenAddress), Cl.bool(true)],
      address1
    );
    expect(receipt2.result).toBeOk(Cl.bool(false));
    // Third confirmation completes action
    const receipt3 = simnet.callPublicFn(
      contractAddress,
      "set-asset",
      [Cl.uint(TEST_NONCE), Cl.principal(mockTokenAddress), Cl.bool(true)],
      address2
    );
    expect(receipt3.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "transfer-dao-token",
      [
        Cl.uint(TEST_NONCE),
        Cl.principal(mockTokenAddress),
        Cl.uint(100),
        Cl.principal(address1),
      ],
      address5
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_OWNER));
  });

  it("transfer-dao-token() fails if asset is not allowed", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "transfer-dao-token",
      [
        Cl.uint(TEST_NONCE),
        Cl.principal(mockTokenAddress),
        Cl.uint(100),
        Cl.principal(address1),
      ],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_ASSET_NOT_ALLOWED));
  });
});

describe(`read-only functions: ${contractName}`, () => {
  beforeEach(() => {
    // Set up initial owners for testing
    simnet.callPublicFn(
      contractAddress,
      "set-owner",
      [Cl.uint(TEST_NONCE), Cl.principal(deployer), Cl.bool(true)],
      deployer
    );

    // Set up an allowed asset
    const nonce = Cl.uint(2);
    simnet.callPublicFn(
      contractAddress,
      "set-owner",
      [nonce, Cl.principal(address1), Cl.bool(true)],
      deployer
    );
    simnet.callPublicFn(
      contractAddress,
      "set-owner",
      [Cl.uint(3), Cl.principal(address2), Cl.bool(true)],
      deployer
    );

    // Add an allowed asset
    const assetNonce = Cl.uint(4);
    simnet.callPublicFn(
      contractAddress,
      "set-asset",
      [assetNonce, Cl.principal(mockTokenAddress), Cl.bool(true)],
      deployer
    );
    simnet.callPublicFn(
      contractAddress,
      "set-asset",
      [assetNonce, Cl.principal(mockTokenAddress), Cl.bool(true)],
      address1
    );
    simnet.callPublicFn(
      contractAddress,
      "set-asset",
      [assetNonce, Cl.principal(mockTokenAddress), Cl.bool(true)],
      address2
    );
  });

  ////////////////////////////////////////
  // is-owner() tests
  ////////////////////////////////////////
  it("is-owner() returns true for owners", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "is-owner",
      [Cl.principal(deployer)],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(Cl.bool(true));
  });

  it("is-owner() returns false for non-owners", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "is-owner",
      [Cl.principal(address5)],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(Cl.bool(false));
  });

  ////////////////////////////////////////
  // get-current-id() tests
  ////////////////////////////////////////
  it("get-current-id() returns the expected confirmation ID", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-current-id",
      [],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(Cl.uint(0));
  });

  ////////////////////////////////////////
  // get-confirmations-required() tests
  ////////////////////////////////////////
  it("get-confirmations-required() returns the expected number", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-confirmations-required",
      [],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(Cl.uint(3));
  });

  ////////////////////////////////////////
  // has-confirmed() tests
  ////////////////////////////////////////
  it("has-confirmed() returns true when an owner has confirmed", () => {
    // arrange
    const nonce = Cl.uint(5);
    simnet.callPublicFn(
      contractAddress,
      "set-owner",
      [nonce, Cl.principal(address3), Cl.bool(true)],
      deployer
    );

    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "has-confirmed",
      [SET_OWNER, nonce, Cl.principal(deployer)],
      deployer
    ).result;

    // assert
    expect(result).toStrictEqual(Cl.bool(true));
  });

  it("has-confirmed() returns false when an owner has not confirmed", () => {
    // arrange
    const nonce = Cl.uint(6);

    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "has-confirmed",
      [SET_OWNER, nonce, Cl.principal(deployer)],
      deployer
    ).result;

    // assert
    expect(result).toStrictEqual(Cl.bool(false));
  });

  ////////////////////////////////////////
  // get-confirmations() tests
  ////////////////////////////////////////
  it("get-confirmations() returns the correct number of confirmations", () => {
    // arrange
    const nonce = Cl.uint(7);
    simnet.callPublicFn(
      contractAddress,
      "set-owner",
      [nonce, Cl.principal(address3), Cl.bool(true)],
      deployer
    );

    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-confirmations",
      [SET_OWNER, nonce],
      deployer
    ).result;

    // assert
    expect(result).toStrictEqual(Cl.uint(1)); // Only deployer has confirmed
  });

  ////////////////////////////////////////
  // is-allowed-asset() tests
  ////////////////////////////////////////
  it("is-allowed-asset() returns true for allowed assets", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "is-allowed-asset",
      [Cl.principal(mockTokenAddress)],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(Cl.bool(true));
  });

  it("is-allowed-asset() returns false for non-allowed assets", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "is-allowed-asset",
      [Cl.principal(deployer + ".non-allowed-token")],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(Cl.bool(false));
  });

  ////////////////////////////////////////
  // get-allowed-asset() tests
  ////////////////////////////////////////
  it("get-allowed-asset() returns the correct status for a given asset", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-allowed-asset",
      [Cl.principal(mockTokenAddress)],
      deployer
    ).result;
    // assert
    expect(result).toBeSome(Cl.bool(true));
  });

  ////////////////////////////////////////
  // get-contract-info() tests
  ////////////////////////////////////////
  it("get-contract-info() returns the expected contract information", () => {
    // arrange
    const expectedContractInfo = {
      self: Cl.principal(contractAddress),
      deployedBurnBlock: Cl.uint(4),
      deployedStacksBlock: Cl.uint(4),
    };
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-contract-info",
      [],
      deployer
    ).result;

    if (result.type !== ClarityType.Tuple) {
      throw new Error("Expected result to be a tuple");
    }

    const tupleData = result.value;
    expect(tupleData).toStrictEqual(expectedContractInfo);
  });
});
