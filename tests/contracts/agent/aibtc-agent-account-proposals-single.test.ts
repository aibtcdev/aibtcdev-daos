import { Cl, cvToValue } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeAgentAccount } from "../../../utilities/contract-error-codes";
import { setupFullContractRegistry } from "../../../utilities/contract-registry";
import { convertSIP019PrintEvent } from "../../../utilities/contract-helpers";
import {
  completePrelaunch,
  constructDao,
  formatSerializedBuffer,
  fundAgentAccount,
  PROPOSAL_MESSAGE,
  TEST_MEMO_BUFF,
} from "../../../utilities/dao-helpers";
import { dbgLog } from "../../../utilities/debug-logging";
import { AGENT_ACCOUNT_APPROVAL_TYPES } from "../../../utilities/agent-account-types";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

// setup contract info for tests
const registry = setupFullContractRegistry();

const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "AGENT",
  "AGENT_ACCOUNT"
);
const contractName = contractAddress.split(".")[1];

const actionProposalsContractAddress =
  registry.getContractAddressByTypeAndSubtype(
    "EXTENSIONS",
    "ACTION_PROPOSAL_VOTING"
  );
const sendMessageActionContractAddress =
  registry.getContractAddressByTypeAndSubtype("ACTIONS", "SEND_MESSAGE");

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // create-action-proposal() tests
  ////////////////////////////////////////
  it("create-action-proposal() emits the correct notification event", () => {
    // arrange
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const expectedEvent = {
      notification: "aibtc-agent-account/create-action-proposal",
      payload: {
        proposalContract: actionProposalsContractAddress,
        action: sendMessageActionContractAddress,
        parameters: cvToValue(formatSerializedBuffer(message)),
        memo: cvToValue(TEST_MEMO_BUFF),
        sender: deployer,
        caller: deployer,
      },
    };
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    constructDao(deployer);

    // approve the proposal contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.VOTING),
      ],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        TEST_MEMO_BUFF,
      ],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    dbgLog(printEvent, { titleBefore: "create-action-proposal() event" });
    expect(printEvent).toStrictEqual(expectedEvent);
  });
});
