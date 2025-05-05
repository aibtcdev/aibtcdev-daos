import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
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
  "CORE",
  "DAO_RUN_COST"
);
const contractName = contractAddress.split(".")[1];

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
  // set-run-cost() tests
  ////////////////////////////////////////
  it("set-run-cost() fails if called by unauthorized principal", () => {
    // arrange
    
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "set-run-cost",
    //   [/* parameters */],
    //   address1
    // );
    
    // assert
    // expect(receipt.result).toBeErr(/* expected error */);
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // get-run-cost() tests
  ////////////////////////////////////////
  it("get-run-cost() returns expected value", () => {
    // arrange
    
    // act
    // const result = simnet.callReadOnlyFn(
    //   contractAddress,
    //   "get-run-cost",
    //   [],
    //   deployer
    // ).result;
    
    // assert
    // expect(result).toStrictEqual(/* expected value */);
  });
});
