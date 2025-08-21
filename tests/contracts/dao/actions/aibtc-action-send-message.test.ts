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
import { convertSIP019PrintEvent } from "../../../../utilities/contract-helpers";
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
  it("callback() responds with (ok true)", () => {
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
  it("run() succeeds if called as a DAO action proposal, emitting a print event", () => {
    // arrange
    const memo = "hello world";
    // fund accounts for creating and voting on proposals
    const voters = [deployer, address1, address2, address3];
    // construct the DAO
    completePrelaunch(deployer);
    constructDao(deployer);
    // act: pass the action proposal, which will execute the `run` function
    const receipt = passActionProposal(
      "SEND_MESSAGE",
      Cl.stringUtf8(PROPOSAL_MESSAGE),
      deployer,
      deployer,
      voters,
      memo
    );

    // assert: check for the print event from the action contract
    const printEventResult = receipt.events.find(
      (e: any) =>
        e.event === "print_event" &&
        e.data.contract_identifier === contractAddress
    );
    expect(printEventResult).toBeDefined();
    const printEvent = convertSIP019PrintEvent(printEventResult);
    const baseDaoContractAddress =
      registry.getContractAddressByTypeAndSubtype("BASE", "DAO");
    const expectedEvent = {
      notification: "aibtc-action-send-message/run",
      payload: {
        message: PROPOSAL_MESSAGE,
        memo: memo,
        sender: baseDaoContractAddress,
      },
    };
    expect(printEvent).toStrictEqual(expectedEvent);
  });
});
