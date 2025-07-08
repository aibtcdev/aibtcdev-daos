import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeOnchainMessaging } from "../../../../utilities/contract-error-codes";
import { setupDaoContractRegistry } from "../../../../utilities/contract-registry";
import { constructDao, getDaoTokens } from "../../../../utilities/dao-helpers";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;

// setup contract info for tests
const registry = setupDaoContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "EXTENSIONS",
  "ONCHAIN_MESSAGING"
);
const contractName = contractAddress.split(".")[1];

// import error codes
const ErrCode = ErrCodeOnchainMessaging;

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
  // send() tests
  ////////////////////////////////////////
  it("send() fails with empty message", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "send",
      [Cl.stringUtf8("")],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_INPUT));
  });

  it("send() succeeds with valid message", () => {
    // arrange: construct the dao and fund the user
    constructDao(deployer);
    getDaoTokens(address1, 1000000);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "send",
      [Cl.stringUtf8("Test message")],
      address1
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
});

// Note: There are no read-only functions in this contract
