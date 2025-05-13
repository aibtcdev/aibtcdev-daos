import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { setupDaoContractRegistry } from "../../../../utilities/contract-registry";

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
  "POOL"
);
const contractName = contractAddress.split(".")[1];
const tokenContractAddress = registry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "DAO"
);

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // add-to-position() tests
  ////////////////////////////////////////
  it("add-to-position() succeeds with valid parameters", () => {
    // arrange
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "add-to-position",
    //   [/* parameters */],
    //   address1
    // );
    // assert
    // expect(receipt.result).toBeOk(/* expected value */);
  });

  ////////////////////////////////////////
  // reduce-position() tests
  ////////////////////////////////////////
  it("reduce-position() succeeds with valid parameters", () => {
    // arrange
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "reduce-position",
    //   [/* parameters */],
    //   address1
    // );
    // assert
    // expect(receipt.result).toBeOk(/* expected value */);
  });

  ////////////////////////////////////////
  // swap-x-for-y() tests
  ////////////////////////////////////////
  it("swap-x-for-y() succeeds with valid parameters", () => {
    // arrange
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "swap-x-for-y",
    //   [/* parameters */],
    //   address1
    // );
    // assert
    // expect(receipt.result).toBeOk(/* expected value */);
  });

  ////////////////////////////////////////
  // swap-y-for-x() tests
  ////////////////////////////////////////
  it("swap-y-for-x() succeeds with valid parameters", () => {
    // arrange
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "swap-y-for-x",
    //   [/* parameters */],
    //   address1
    // );
    // assert
    // expect(receipt.result).toBeOk(/* expected value */);
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // get-position() tests
  ////////////////////////////////////////
  it("get-position() returns expected value", () => {
    // arrange
    // act
    // const result = simnet.callReadOnlyFn(
    //   contractAddress,
    //   "get-position",
    //   [/* parameters */],
    //   deployer
    // ).result;
    // assert
    // expect(result).toStrictEqual(/* expected value */);
  });

  ////////////////////////////////////////
  // get-pool-details() tests
  ////////////////////////////////////////
  it("get-pool-details() returns expected value", () => {
    // arrange
    // act
    // const result = simnet.callReadOnlyFn(
    //   contractAddress,
    //   "get-pool-details",
    //   [],
    //   deployer
    // ).result;
    // assert
    // expect(result).toStrictEqual(/* expected value */);
  });

  ////////////////////////////////////////
  // get-x-to-y-price() tests
  ////////////////////////////////////////
  it("get-x-to-y-price() returns expected value", () => {
    // arrange
    // act
    // const result = simnet.callReadOnlyFn(
    //   contractAddress,
    //   "get-x-to-y-price",
    //   [/* parameters */],
    //   deployer
    // ).result;
    // assert
    // expect(result).toStrictEqual(/* expected value */);
  });

  ////////////////////////////////////////
  // get-y-to-x-price() tests
  ////////////////////////////////////////
  it("get-y-to-x-price() returns expected value", () => {
    // arrange
    // act
    // const result = simnet.callReadOnlyFn(
    //   contractAddress,
    //   "get-y-to-x-price",
    //   [/* parameters */],
    //   deployer
    // ).result;
    // assert
    // expect(result).toStrictEqual(/* expected value */);
  });
});
