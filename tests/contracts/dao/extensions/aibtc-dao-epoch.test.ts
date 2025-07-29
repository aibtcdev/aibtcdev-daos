import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { setupDaoContractRegistry } from "../../../../utilities/contract-registry";
import { constructDao } from "../../../../utilities/dao-helpers";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

// setup contract info for tests
const registry = setupDaoContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "EXTENSIONS",
  "DAO_EPOCH"
);
const contractName = contractAddress.split(".")[1];

describe.skip(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // callback() tests
  ////////////////////////////////////////
  it("callback() should respond with (ok true)", () => {
    // arrange

    // act
    const callback = simnet.callPublicFn(
      contractAddress,
      "callback",
      [Cl.principal(deployer), Cl.bufferFromAscii("test")],
      deployer
    );

    // assert
    expect(callback.result).toBeOk(Cl.bool(true));
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // get-current-dao-epoch() tests
  ////////////////////////////////////////
  it("get-current-dao-epoch() returns expected value", () => {
    // arrange
    constructDao(deployer);
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-current-dao-epoch",
      [],
      deployer
    ).result;
    // assert
    expect(result).toBeOk(Cl.uint(0));
  });

  ////////////////////////////////////////
  // get-dao-epoch-length() tests
  ////////////////////////////////////////
  it("get-dao-epoch-length() returns expected value", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-dao-epoch-length",
      [],
      deployer
    ).result;
    // assert
    expect(result).toBeOk(Cl.uint(4320));
  });
});
