import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeAgentAccount } from "../utilities/contract-error-codes";
import { setupDaoContractRegistry } from "../utilities/contract-registry";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;

// setup contract info for tests
const registry = setupDaoContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "AGENT",
  "AGENT_ACCOUNT"
);
const contractName = contractAddress.split(".")[1];

// import error codes
const ErrCode = ErrCodeAgentAccount;

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // construct() tests
  ////////////////////////////////////////
  it("construct() fails if called by another address", () => {
    // arrange
    
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "construct",
    //   [/* parameters */],
    //   address1
    // );
    
    // assert
    // expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("construct() succeeds if called by the deployer", () => {
    // arrange
    
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "construct",
    //   [/* parameters */],
    //   deployer
    // );
    
    // assert
    // expect(receipt.result).toBeOk(Cl.bool(true));
  });

  ////////////////////////////////////////
  // transfer-stx() tests
  ////////////////////////////////////////
  it("transfer-stx() fails if called by unauthorized principal", () => {
    // arrange
    
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "transfer-stx",
    //   [/* parameters */],
    //   address1
    // );
    
    // assert
    // expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  ////////////////////////////////////////
  // transfer-ft() tests
  ////////////////////////////////////////
  it("transfer-ft() fails if called by unauthorized principal", () => {
    // arrange
    
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "transfer-ft",
    //   [/* parameters */],
    //   address1
    // );
    
    // assert
    // expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  ////////////////////////////////////////
  // transfer-nft() tests
  ////////////////////////////////////////
  it("transfer-nft() fails if called by unauthorized principal", () => {
    // arrange
    
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "transfer-nft",
    //   [/* parameters */],
    //   address1
    // );
    
    // assert
    // expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // get-balance() tests
  ////////////////////////////////////////
  it("get-balance() returns expected value", () => {
    // arrange
    
    // act
    // const result = simnet.callReadOnlyFn(
    //   contractAddress,
    //   "get-balance",
    //   [],
    //   deployer
    // ).result;
    
    // assert
    // expect(result).toStrictEqual(/* expected value */);
  });

  ////////////////////////////////////////
  // get-ft-balance() tests
  ////////////////////////////////////////
  it("get-ft-balance() returns expected value", () => {
    // arrange
    
    // act
    // const result = simnet.callReadOnlyFn(
    //   contractAddress,
    //   "get-ft-balance",
    //   [/* parameters */],
    //   deployer
    // ).result;
    
    // assert
    // expect(result).toStrictEqual(/* expected value */);
  });
});
