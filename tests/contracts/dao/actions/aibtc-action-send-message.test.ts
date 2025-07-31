import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { ErrCodeActionSendMessage } from "../../../../utilities/contract-error-codes";
import {
  completePrelaunch,
  constructDao,
  formatSerializedBuffer,
  passActionProposal,
  PROPOSAL_MESSAGE,
} from "../../../../utilities/dao-helpers";
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
  "ACTIONS",
  "SEND_MESSAGE"
);
const contractName = contractAddress.split(".")[1];

// import error codes
const ErrCode = ErrCodeActionSendMessage;

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////
  // callback() tests
  ////////////////////////////////////
  it("callback() should respond with (ok true)", () => {
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
  ////////////////////////////////////
  // run() tests
  ////////////////////////////////////
  it("run() fails if called directly", () => {
    // act
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const receipt = simnet.callPublicFn(
      contractAddress,
      "run",
      [formatSerializedBuffer(message)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
  });
  it("run() succeeds if called as a DAO action proposal", () => {
    // arrange
    const memo = "hello world";
    // fund accounts for creating and voting on proposals
    const voters = [deployer, address1, address2, address3];
    // construct the DAO
    completePrelaunch(deployer);
    constructDao(deployer);
    // pass the action proposal
    passActionProposal(
      "SEND_MESSAGE",
      Cl.stringUtf8(PROPOSAL_MESSAGE),
      deployer,
      deployer,
      voters,
      memo
    );
  });
});
