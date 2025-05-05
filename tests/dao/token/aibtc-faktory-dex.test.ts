import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { setupDaoContractRegistry } from "../../utilities/contract-registry";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;

// setup contract info for tests
const registry = setupDaoContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "DEX"
);
const contractName = contractAddress.split(".")[1];
const tokenContractAddress = registry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "DAO"
);

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
    // expect(receipt.result).toBeErr(/* expected error */);
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
  // buy() tests
  ////////////////////////////////////////
  it("buy() succeeds with valid parameters", () => {
    // arrange
    
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "buy",
    //   [/* parameters */],
    //   address1
    // );
    
    // assert
    // expect(receipt.result).toBeOk(/* expected value */);
  });

  ////////////////////////////////////////
  // sell() tests
  ////////////////////////////////////////
  it("sell() succeeds with valid parameters", () => {
    // arrange
    
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "sell",
    //   [/* parameters */],
    //   address1
    // );
    
    // assert
    // expect(receipt.result).toBeOk(/* expected value */);
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // get-price() tests
  ////////////////////////////////////////
  it("get-price() returns expected value", () => {
    // arrange
    
    // act
    // const result = simnet.callReadOnlyFn(
    //   contractAddress,
    //   "get-price",
    //   [/* parameters */],
    //   deployer
    // ).result;
    
    // assert
    // expect(result).toStrictEqual(/* expected value */);
  });

  ////////////////////////////////////////
  // get-token-address() tests
  ////////////////////////////////////////
  it("get-token-address() returns expected value", () => {
    // arrange
    
    // act
    // const result = simnet.callReadOnlyFn(
    //   contractAddress,
    //   "get-token-address",
    //   [],
    //   deployer
    // ).result;
    
    // assert
    // expect(result).toStrictEqual(/* expected value */);
  });
});
