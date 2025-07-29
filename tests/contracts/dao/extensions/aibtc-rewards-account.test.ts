import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeRewardsAccount } from "../../../../utilities/contract-error-codes";
import { setupDaoContractRegistry } from "../../../../utilities/contract-registry";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;

// setup contract info for tests
const registry = setupDaoContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "EXTENSIONS",
  "REWARDS_ACCOUNT"
);
const contractName = contractAddress.split(".")[1];

// import error codes
const ErrCode = ErrCodeRewardsAccount;

describe(`public functions: ${contractName}`, () => {
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

  ////////////////////////////////////////
  // transfer-reward() tests
  ////////////////////////////////////////
  it("transfer-reward() fails if called directly", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "transfer-reward",
      [Cl.principal(address1), Cl.uint(100)],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
  });
});

// Note: There are no read-only functions in this contract that need testing
