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
  VOTING_DELAY,
  VOTING_PERIOD,
} from "../../../utilities/dao-helpers";
import { dbgLog } from "../../../utilities/debug-logging";
import { AGENT_ACCOUNT_APPROVAL_TYPES } from "../../../utilities/agent-account-types";
import { format } from "node:path";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address2 = accounts.get("wallet_2")!; // agent
const address3 = accounts.get("wallet_3")!;

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

// import error codes
const ErrCode = ErrCodeAgentAccount;

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // create-action-proposal() tests
  ////////////////////////////////////////
  it("create-action-proposal() fails if caller is not authorized (user or agent)", () => {
    // arrange
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const memo = Cl.some(Cl.stringAscii("Test memo"));
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        formatSerializedBuffer(memo),
      ],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("create-action-proposal() fails if proposal contract is not approved", () => {
    // arrange
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const memo = Cl.some(Cl.stringAscii("Test memo"));
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    constructDao(deployer);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        formatSerializedBuffer(memo),
      ],
      deployer
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CONTRACT_NOT_APPROVED));
  });

  it("create-action-proposal() succeeds when called by owner", () => {
    // arrange
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    completePrelaunch(deployer);
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
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("create-action-proposal() succeeds for agent if permission is granted", () => {
    // arrange
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
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

    // enable agent to use proposals
    const permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-use-proposals",
      [Cl.bool(true)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      address2 // agent
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("create-action-proposal() emits the correct notification event", () => {
    // arrange
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const expectedEvent = {
      notification: "aibtc-agent-account/create-action-proposal",
      payload: {
        proposalContract: actionProposalsContractAddress,
        action: sendMessageActionContractAddress,
        parameters: cvToValue(formatSerializedBuffer(message)),
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
        Cl.some(Cl.stringAscii("Test memo")),
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

  ////////////////////////////////////////
  // vote-on-action-proposal() tests
  ////////////////////////////////////////
  it("vote-on-action-proposal() fails if caller is not authorized (user or agent)", () => {
    // arrange
    const proposalId = 1;
    const vote = true;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(proposalId),
        Cl.bool(vote),
      ],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("vote-on-action-proposal() fails if proposal contract is not approved", () => {
    // arrange
    const proposalId = 1;
    const vote = true;
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    constructDao(deployer);

    // approve the proposal contract to create proposal
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

    // Create a proposal first
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const createProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));

    // revoke the proposal contract
    const revokeReceipt = simnet.callPublicFn(
      contractAddress,
      "revoke-contract",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.VOTING),
      ],
      deployer
    );
    expect(revokeReceipt.result).toBeOk(Cl.bool(true));

    // progress chain into voting period
    simnet.mineEmptyBlocks(VOTING_DELAY);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(proposalId),
        Cl.bool(vote),
      ],
      deployer
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CONTRACT_NOT_APPROVED));
  });

  it("vote-on-action-proposal() succeeds when called by owner", () => {
    // arrange
    const proposalId = 1;
    const vote = true;
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

    // Create a proposal first
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const createProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));

    // progress chain into voting period
    simnet.mineEmptyBlocks(VOTING_DELAY);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(proposalId),
        Cl.bool(vote),
      ],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("vote-on-action-proposal() emits the correct notification event", () => {
    // arrange
    const proposalId = "1";
    const vote = true;
    const expectedEvent = {
      notification: "aibtc-agent-account/vote-on-action-proposal",
      payload: {
        proposalContract: actionProposalsContractAddress,
        proposalId: proposalId,
        vote: vote,
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

    // Create a proposal first
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const createProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));

    // progress chain into voting period
    simnet.mineEmptyBlocks(VOTING_DELAY);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(proposalId),
        Cl.bool(vote),
      ],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    dbgLog(printEvent, { titleBefore: "vote-on-action-proposal() event" });
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // veto-action-proposal() tests
  ////////////////////////////////////////

  it("veto-action-proposal() fails if caller is not authorized (user or agent)", () => {
    // arrange
    const proposalId = 1;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "veto-action-proposal",
      [Cl.principal(actionProposalsContractAddress), Cl.uint(proposalId)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("veto-action-proposal() fails if proposal contract is not approved", () => {
    // arrange
    const proposalId = 1;
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    constructDao(deployer);

    // approve the proposal contract to create proposal
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

    // Create a proposal first
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const createProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));

    // revoke the proposal contract
    const revokeReceipt = simnet.callPublicFn(
      contractAddress,
      "revoke-contract",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.VOTING),
      ],
      deployer
    );
    expect(revokeReceipt.result).toBeOk(Cl.bool(true));

    // progress chain past voting delay and period
    simnet.mineEmptyBlocks(VOTING_DELAY + VOTING_PERIOD);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "veto-action-proposal",
      [Cl.principal(actionProposalsContractAddress), Cl.uint(proposalId)],
      deployer
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CONTRACT_NOT_APPROVED));
  });

  it("veto-action-proposal() succeeds when called by owner", () => {
    // arrange
    const proposalId = 1;
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

    // Create a proposal first
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const createProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress chain past voting delay and period
    simnet.mineEmptyBlocks(VOTING_DELAY + VOTING_PERIOD);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "veto-action-proposal",
      [Cl.principal(actionProposalsContractAddress), Cl.uint(proposalId)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("veto-action-proposal() succeeds for agent if permission is granted", () => {
    // arrange
    const proposalId = 1;
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

    // enable agent to use proposals
    const permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-use-proposals",
      [Cl.bool(true)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));

    // Create a proposal first
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const createProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));

    // progress chain past voting delay and period
    simnet.mineEmptyBlocks(VOTING_DELAY + VOTING_PERIOD);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "veto-action-proposal",
      [Cl.principal(actionProposalsContractAddress), Cl.uint(proposalId)],
      address2 // agent
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("veto-action-proposal() emits the correct notification event", () => {
    // arrange
    const proposalId = "1";
    const expectedEvent = {
      notification: "aibtc-agent-account/veto-action-proposal",
      payload: {
        proposalContract: actionProposalsContractAddress,
        proposalId: proposalId,
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

    // Create a proposal first
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const createProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));
    // progress chain past voting delay and period
    simnet.mineEmptyBlocks(VOTING_DELAY + VOTING_PERIOD);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "veto-action-proposal",
      [Cl.principal(actionProposalsContractAddress), Cl.uint(proposalId)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    dbgLog(printEvent, { titleBefore: "veto-action-proposal() event" });
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // conclude-action-proposal() tests
  ////////////////////////////////////////
  it("conclude-action-proposal() fails if caller is not authorized (user or agent)", () => {
    // arrange
    const proposalId = 1;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(proposalId),
        Cl.principal(sendMessageActionContractAddress),
      ],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("conclude-action-proposal() fails if contract is not approved", () => {
    // arrange
    const proposalId = 1;
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    constructDao(deployer);

    // approve the proposal contract to create the proposal
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

    // Create a proposal first
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const createProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));

    // progress chain into voting period
    simnet.mineEmptyBlocks(VOTING_DELAY);

    // Vote on the proposal
    const voteReceipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(proposalId),
        Cl.bool(true),
      ],
      deployer
    );
    expect(voteReceipt.result).toBeOk(Cl.bool(true));

    // progress chain into execution period
    simnet.mineEmptyBlocks(VOTING_PERIOD + VOTING_DELAY);

    // revoke the proposal contract approval
    const revokeReceipt = simnet.callPublicFn(
      contractAddress,
      "revoke-contract",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.VOTING),
      ],
      deployer
    );
    expect(revokeReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(proposalId),
        Cl.principal(sendMessageActionContractAddress),
      ],
      deployer
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CONTRACT_NOT_APPROVED));
  });

  it("conclude-action-proposal() succeeds for agent if permission is granted", () => {
    // arrange
    const proposalId = 1;
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

    // enable agent to use proposals
    const permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-use-proposals",
      [Cl.bool(true)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));

    // Create a proposal first
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const createProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));

    // progress chain into voting period
    simnet.mineEmptyBlocks(VOTING_DELAY);

    // Vote on the proposal
    const voteReceipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(proposalId),
        Cl.bool(true),
      ],
      deployer
    );
    expect(voteReceipt.result).toBeOk(Cl.bool(true));

    // progress chain into execution period
    simnet.mineEmptyBlocks(VOTING_PERIOD + VOTING_DELAY);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(proposalId),
        Cl.principal(sendMessageActionContractAddress),
      ],
      address2 // agent
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("conclude-action-proposal() succeeds when called by owner", () => {
    // arrange
    const proposalId = 1;
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

    // Create a proposal first
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const createProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));

    // progress chain into voting period
    simnet.mineEmptyBlocks(VOTING_DELAY);

    // Vote on the proposal
    const voteReceipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(proposalId),
        Cl.bool(true),
      ],
      deployer
    );
    expect(voteReceipt.result).toBeOk(Cl.bool(true));

    // progress chain into execution period
    simnet.mineEmptyBlocks(VOTING_PERIOD + VOTING_DELAY);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(proposalId),
        Cl.principal(sendMessageActionContractAddress),
      ],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("conclude-action-proposal() emits the correct notification event", () => {
    // arrange
    const proposalId = "1";
    const expectedEvent = {
      notification: "aibtc-agent-account/conclude-action-proposal",
      payload: {
        proposalContract: actionProposalsContractAddress,
        proposalId: proposalId,
        action: sendMessageActionContractAddress,
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

    // Create a proposal first
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const createProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));

    // progress chain into voting period
    simnet.mineEmptyBlocks(VOTING_DELAY);

    // Vote on the proposal
    const voteReceipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(proposalId),
        Cl.bool(true),
      ],
      deployer
    );
    expect(voteReceipt.result).toBeOk(Cl.bool(true));

    // progress chain into execution period
    simnet.mineEmptyBlocks(VOTING_PERIOD + VOTING_DELAY);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(proposalId),
        Cl.principal(sendMessageActionContractAddress),
      ],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    dbgLog(printEvent, { titleBefore: "conclude-action-proposal() event" });
    expect(printEvent).toStrictEqual(expectedEvent);
  });
});

describe(`read-only functions: ${contractName}`, () => {
  it("agent fails to create proposals if not authorized", () => {
    // arrange
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
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

    // disable agent to use proposals
    const permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-use-proposals",
      [Cl.bool(false)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      address2 // agent
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("agent fails to create proposals if contract is not approved", () => {
    // arrange
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    constructDao(deployer);

    // enable agent to use proposals
    const permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-use-proposals",
      [Cl.bool(true)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      address2 // agent
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CONTRACT_NOT_APPROVED));
  });

  it("agent can use proposals when authorized and fails when revoked", () => {
    // arrange
    let proposalId = 1;
    const vote = true;
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    constructDao(deployer);

    // Owner approves the proposal contract
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

    // Owner enables agent to use proposals
    let permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-use-proposals",
      [Cl.bool(true)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));

    // Create a proposal first (owner does this)
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const createProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));

    // progress chain into voting period
    simnet.mineEmptyBlocks(VOTING_DELAY);

    // act - agent votes on proposal
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(proposalId),
        Cl.bool(vote),
      ],
      address2 // agent address
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // Revoke agent proposal permission
    permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-use-proposals",
      [Cl.bool(false)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));

    // Create a second proposal
    proposalId = 2;
    const createProposalReceipt2 = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo 2")),
      ],
      deployer // owner still has to create it
    );
    expect(createProposalReceipt2.result).toBeOk(Cl.bool(true));

    // progress chain into voting period
    simnet.mineEmptyBlocks(VOTING_DELAY);

    // act - agent votes on second proposal
    const receipt2 = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(proposalId),
        Cl.bool(vote),
      ],
      address2 // agent address
    );

    // assert
    expect(receipt2.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("agent fails to vote on proposals if contract is not approved", () => {
    // arrange
    const proposalId = 1;
    const vote = true;
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    constructDao(deployer);

    // enable agent to use proposals
    const permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-use-proposals",
      [Cl.bool(true)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));

    // approve the proposal contract to create proposal
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

    // Create a proposal first
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const createProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      deployer // owner creates
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));

    // revoke the proposal contract
    const revokeReceipt = simnet.callPublicFn(
      contractAddress,
      "revoke-contract",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.VOTING),
      ],
      deployer
    );
    expect(revokeReceipt.result).toBeOk(Cl.bool(true));

    // progress chain into voting period
    simnet.mineEmptyBlocks(VOTING_DELAY);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.uint(proposalId),
        Cl.bool(vote),
      ],
      address2 // agent
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CONTRACT_NOT_APPROVED));
  });

  it("agent fails to veto proposals if not authorized", () => {
    // arrange
    const proposalId = 1;
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

    // disable agent to use proposals
    const permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-use-proposals",
      [Cl.bool(false)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));

    // Create a proposal first
    const message = Cl.stringUtf8(PROPOSAL_MESSAGE);
    const createProposalReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        formatSerializedBuffer(message),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      deployer
    );
    expect(createProposalReceipt.result).toBeOk(Cl.bool(true));

    // progress chain past voting delay and period
    simnet.mineEmptyBlocks(VOTING_DELAY + VOTING_PERIOD);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "veto-action-proposal",
      [Cl.principal(actionProposalsContractAddress), Cl.uint(proposalId)],
      address2 // agent
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });
});
