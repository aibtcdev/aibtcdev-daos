import { Cl, ClarityType, ClarityValue, cvToValue } from "@stacks/transactions";
import { describe, expect, it, beforeEach } from "vitest";
import { setupFullContractRegistry } from "../../../utilities/contract-registry";

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

// Error constants from the contract
const ERR_NOT_OWNER = 1000;
const ERR_ASSET_NOT_ALLOWED = 1001;

// Constants for testing
const SET_OWNER = Cl.uint(1);
const SET_ASSET = Cl.uint(2);
const TRANSFER = Cl.uint(3);
const SET_CONFIRMATIONS = Cl.uint(4);
const TEST_NONCE = Cl.uint(1);

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
      [TEST_NONCE, Cl.principal(address1), Cl.bool(true)],
      address5
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_NOT_OWNER));
  });

  it("set-owner() succeeds with sufficient confirmations", () => {
    // arrange
    // First confirmation creates proposal but doesn't execute
    const receipt1 = simnet.callPublicFn(
      contractAddress,
      "set-owner",
      [TEST_NONCE, Cl.principal(address5), Cl.bool(true)],
      deployer
    );
    expect(receipt1.result).toBeOk(Cl.bool(false));
    
    // Second confirmation doesn't execute yet
    const receipt2 = simnet.callPublicFn(
      contractAddress,
      "set-owner",
      [TEST_NONCE, Cl.principal(address5), Cl.bool(true)],
      address1
    );
    expect(receipt2.result).toBeOk(Cl.bool(false));
    
    // act
    // Third confirmation reaches threshold and executes
    const receipt3 = simnet.callPublicFn(
      contractAddress,
      "set-owner",
      [TEST_NONCE, Cl.principal(address5), Cl.bool(true)],
      address2
    );
    
    // assert
    expect(receipt3.result).toBeOk(Cl.bool(true));
    
    // Verify the new owner was added
    const isOwner = simnet.callReadOnlyFn(
      contractAddress,
      "is-owner",
      [Cl.principal(address5)],
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
      [TEST_NONCE, Cl.principal(mockTokenAddress), Cl.bool(true)],
      address5
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_NOT_OWNER));
  });

  it("set-asset() succeeds with sufficient confirmations", () => {
    // First confirmation creates proposal but doesn't execute
    const receipt1 = simnet.callPublicFn(
      contractAddress,
      "set-asset",
      [TEST_NONCE, Cl.principal(mockTokenAddress), Cl.bool(true)],
      deployer
    );
    expect(receipt1.result).toBeOk(Cl.bool(false));
    
    // Second confirmation doesn't execute yet
    const receipt2 = simnet.callPublicFn(
      contractAddress,
      "set-asset",
      [TEST_NONCE, Cl.principal(mockTokenAddress), Cl.bool(true)],
      address1
    );
    expect(receipt2.result).toBeOk(Cl.bool(false));
    
    // act
    // Third confirmation reaches threshold and executes
    const receipt3 = simnet.callPublicFn(
      contractAddress,
      "set-asset",
      [TEST_NONCE, Cl.principal(mockTokenAddress), Cl.bool(true)],
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
    // Set up an allowed asset first
    const assetNonce = Cl.uint(2);
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
    
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "transfer-dao-token",
      [
        TEST_NONCE,
        Cl.principal(mockTokenAddress),
        Cl.uint(100),
        Cl.principal(address1),
      ],
      address5
    );
    
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_NOT_OWNER));
  });

  it("transfer-dao-token() fails if asset is not allowed", () => {
    // arrange
    const nonAllowedToken = `${deployer}.non-allowed-token`;
    
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "transfer-dao-token",
      [
        TEST_NONCE,
        Cl.principal(nonAllowedToken),
        Cl.uint(100),
        Cl.principal(address1),
      ],
      deployer
    );
    
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_ASSET_NOT_ALLOWED));
  });
  
  ////////////////////////////////////////
  // set-confirmations() tests
  ////////////////////////////////////////
  it("set-confirmations() fails if called by non-owner", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-confirmations",
      [TEST_NONCE, Cl.uint(2)],
      address5
    );
    
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_NOT_OWNER));
  });

  it("set-confirmations() succeeds with sufficient confirmations", () => {
    // arrange
    const newConfirmationsNonce = Cl.uint(3);
    
    // First confirmation creates proposal but doesn't execute
    const receipt1 = simnet.callPublicFn(
      contractAddress,
      "set-confirmations",
      [newConfirmationsNonce, Cl.uint(2)],
      deployer
    );
    expect(receipt1.result).toBeOk(Cl.bool(false));
    
    // Second confirmation doesn't execute yet
    const receipt2 = simnet.callPublicFn(
      contractAddress,
      "set-confirmations",
      [newConfirmationsNonce, Cl.uint(2)],
      address1
    );
    expect(receipt2.result).toBeOk(Cl.bool(false));
    
    // act
    // Third confirmation reaches threshold and executes
    const receipt3 = simnet.callPublicFn(
      contractAddress,
      "set-confirmations",
      [newConfirmationsNonce, Cl.uint(2)],
      address2
    );
    
    // assert
    expect(receipt3.result).toBeOk(Cl.bool(true));
    
    // Verify the confirmations required was updated
    const confirmationsRequired = simnet.callReadOnlyFn(
      contractAddress,
      "get-confirmations-required",
      [],
      deployer
    ).result;
    expect(confirmationsRequired).toStrictEqual(Cl.uint(2));
  });
});

describe(`read-only functions: ${contractName}`, () => {
  beforeEach(() => {
    // Set up an allowed asset for testing
    const assetNonce = Cl.uint(10);
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
  // owner-has-confirmed() tests
  ////////////////////////////////////////
  it("owner-has-confirmed() returns true when an owner has confirmed", () => {
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
      "owner-has-confirmed",
      [SET_OWNER, nonce, Cl.principal(deployer)],
      deployer
    ).result;

    // assert
    expect(result).toStrictEqual(Cl.bool(true));
  });

  it("owner-has-confirmed() returns false when an owner has not confirmed", () => {
    // arrange
    const nonce = Cl.uint(6);

    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "owner-has-confirmed",
      [SET_OWNER, nonce, Cl.principal(deployer)],
      deployer
    ).result;

    // assert
    expect(result).toStrictEqual(Cl.bool(false));
  });

  ////////////////////////////////////////
  // get-total-confirmations() tests
  ////////////////////////////////////////
  it("get-total-confirmations() returns the correct number of confirmations", () => {
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
      "get-total-confirmations",
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
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-contract-info",
      [],
      deployer
    ).result;

    // assert
    expect(result.type).toBe(ClarityType.Tuple);
    
    if (result.type === ClarityType.Tuple) {
      const tupleData = result.value;
      expect(tupleData.self).toStrictEqual(Cl.principal(contractAddress));
      expect(tupleData.deployedBurnBlock).toBeDefined();
      expect(tupleData.deployedStacksBlock).toBeDefined();
    }
  });
  
  ////////////////////////////////////////
  // get-proposal-totals() tests
  ////////////////////////////////////////
  it("get-proposal-totals() returns the correct proposal counts", () => {
    // arrange
    // Create some proposals to increment counters
    simnet.callPublicFn(
      contractAddress,
      "set-owner",
      [Cl.uint(20), Cl.principal(address3), Cl.bool(true)],
      deployer
    );
    
    simnet.callPublicFn(
      contractAddress,
      "set-asset",
      [Cl.uint(21), Cl.principal(mockTokenAddress), Cl.bool(true)],
      deployer
    );
    
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-proposal-totals",
      [],
      deployer
    ).result;
    
    // assert
    expect(result.type).toBe(ClarityType.Tuple);
    
    if (result.type === ClarityType.Tuple) {
      const totals = result.value;
      expect(totals.setOwner).toBeDefined();
      expect(totals.setAsset).toBeDefined();
      expect(totals.transfer).toBeDefined();
      expect(totals.setConfirmations).toBeDefined();
    }
  });
});
