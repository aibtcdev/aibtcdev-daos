import { Cl, ClarityType, ClarityValue, cvToValue } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeAgentAccount } from "../../../utilities/contract-error-codes";
import { setupFullContractRegistry } from "../../../utilities/contract-registry";
import {
  convertSIP019PrintEvent,
  DAO_TOKEN_ASSETS_MAP,
  SBTC_ASSETS_MAP,
  SBTC_CONTRACT,
} from "../../../utilities/contract-helpers";
import { getBalancesForPrincipal } from "../../../utilities/asset-helpers";
import {
  constructDao,
  formatSerializedBuffer,
  fundVoters,
  VOTING_DELAY,
  VOTING_PERIOD,
} from "../../../utilities/dao-helpers";
import { dbgLog } from "../../../utilities/debug-logging";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!; // agent
const address3 = accounts.get("wallet_3")!;

// setup contract info for tests
const registry = setupFullContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "AGENT",
  "AGENT_ACCOUNT"
);
const contractName = contractAddress.split(".")[1];

// DAO contract references
const daoTokenAddress = registry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "DAO"
);
const tokenDexContractAddress = registry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "DEX"
);
const actionProposalsContractAddress =
  registry.getContractAddressByTypeAndSubtype(
    "EXTENSIONS",
    "ACTION_PROPOSAL_VOTING"
  );
const sendMessageActionContractAddress =
  registry.getContractAddressByTypeAndSubtype("ACTIONS", "SEND_MESSAGE");

// import error codes
const ErrCode = ErrCodeAgentAccount;

// Helper function to set up the account for testing
function setupAgentAccount(sender: string, satsAmount: number = 1000000) {
  // get sBTC from the faucet
  const faucetReceipt = simnet.callPublicFn(
    SBTC_CONTRACT,
    "faucet",
    [],
    sender
  );
  dbgLog(faucetReceipt, { titleBefore: "faucetReceipt" });
  expect(faucetReceipt.result).toBeOk(Cl.bool(true));

  // get dao tokens from the dex
  const dexReceipt = simnet.callPublicFn(
    tokenDexContractAddress,
    "buy",
    [Cl.principal(daoTokenAddress), Cl.uint(satsAmount)],
    sender
  );
  dbgLog(dexReceipt, { titleBefore: "dexReceipt" });
  expect(dexReceipt.result).toBeOk(Cl.bool(true));

  // get balances for dao token and sbtc
  const senderBalances = getBalancesForPrincipal(sender);
  const senderSbtcBalance = senderBalances.get(SBTC_ASSETS_MAP)!;
  const senderDaoTokenBalance = senderBalances.get(DAO_TOKEN_ASSETS_MAP)!;

  // approve contracts for deposit
  simnet.callPublicFn(
    contractAddress,
    "approve-contract",
    [Cl.principal(SBTC_CONTRACT)],
    sender
  );
  simnet.callPublicFn(
    contractAddress,
    "approve-contract",
    [Cl.principal(daoTokenAddress)],
    sender
  );

  // deposit sBTC to the agent account
  const depositReceiptSbtc = simnet.callPublicFn(
    contractAddress,
    "deposit-ft",
    [Cl.principal(SBTC_CONTRACT), Cl.uint(senderSbtcBalance)],
    sender
  );
  expect(depositReceiptSbtc.result).toBeOk(Cl.bool(true));

  // deposit DAO tokens to the agent account
  const depositReceiptDao = simnet.callPublicFn(
    contractAddress,
    "deposit-ft",
    [Cl.principal(daoTokenAddress), Cl.uint(senderDaoTokenBalance)],
    sender
  );
  dbgLog(depositReceiptDao, {
    titleBefore: "depositReceiptDao",
  });
  expect(depositReceiptDao.result).toBeOk(Cl.bool(true));
}

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // deposit-stx() tests
  ////////////////////////////////////////
  it("deposit-stx() succeeds and deposits STX to the agent account", () => {
    // arrange
    const agentAccountBalances = getBalancesForPrincipal(contractAddress);
    const agentAccountStxBalance = agentAccountBalances.get("STX");
    expect(agentAccountStxBalance).toBeUndefined();

    const amount = 1000000; // 1 STX

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-stx",
      [Cl.uint(amount)],
      deployer
    );

    const agentAccountBalances2 = getBalancesForPrincipal(contractAddress);
    const agentAccountStxBalance2 = agentAccountBalances2.get("STX");
    expect(agentAccountStxBalance2).toEqual(BigInt(amount));

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("deposit-stx() emits the correct notification event", () => {
    // arrange
    const amount = 2000000; // 2 STX
    const expectedEvent = {
      notification: "aibtc-agent-account/deposit-stx",
      payload: {
        contractCaller: deployer,
        txSender: deployer,
        amount: amount.toString(),
        recipient: contractAddress,
      },
    };

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-stx",
      [Cl.uint(amount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // deposit-ft() tests
  ////////////////////////////////////////
  it("deposit-ft() fails if contract is not approved", () => {
    // arrange
    const amount = 10000000;
    const unapprovedToken = `${deployer}.unknown-token`;

    // get sBTC from the faucet
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(unapprovedToken), Cl.uint(amount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CONTRACT_NOT_APPROVED));
  });

  it("deposit-ft() succeeds and transfers sBTC to the account", () => {
    // arrange
    const sbtcAmount = 100000000;

    // get sBTC from the faucet
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));

    // approve the contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(SBTC_CONTRACT)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(sbtcAmount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("deposit-ft() emits the correct notification event", () => {
    // arrange
    const amount = 2000;
    const expectedEvent = {
      notification: "aibtc-agent-account/deposit-ft",
      payload: {
        amount: amount.toString(),
        assetContract: SBTC_CONTRACT,
        txSender: deployer,
        contractCaller: deployer,
        recipient: contractAddress,
      },
    };

    // get sBTC from the faucet
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));

    // approve the contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(SBTC_CONTRACT)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(amount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // withdraw-stx() tests
  ////////////////////////////////////////
  it("withdraw-stx() fails if caller is not the owner", () => {
    // arrange
    const amount = 1000000; // 1 STX

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-stx",
      [Cl.uint(amount)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CALLER_NOT_OWNER));
  });

  it("withdraw-stx() succeeds and transfers STX to owner", () => {
    // arrange
    const amount = 1000000; // 1 STX

    // deposit stx so we can withdraw
    const depositReceipt = simnet.callPublicFn(
      contractAddress,
      "deposit-stx",
      [Cl.uint(amount)],
      deployer
    );
    expect(depositReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-stx",
      [Cl.uint(amount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("withdraw-stx() emits the correct notification event", () => {
    // arrange
    const amount = 2000000; // 2 STX
    const expectedEvent = {
      notification: "aibtc-agent-account/withdraw-stx",
      payload: {
        amount: amount.toString(),
        sender: contractAddress,
        caller: deployer,
        recipient: deployer,
      },
    };

    // deposit stx so we can withdraw
    const depositReceipt = simnet.callPublicFn(
      contractAddress,
      "deposit-stx",
      [Cl.uint(amount)],
      deployer
    );
    expect(depositReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-stx",
      [Cl.uint(amount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // withdraw-ft() tests
  ////////////////////////////////////////
  it("withdraw-ft() fails if caller is not the owner", () => {
    // arrange
    const amount = 10000000;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(amount)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CALLER_NOT_OWNER));
  });

  it("withdraw-ft() fails if contract is not approved", () => {
    // arrange
    const amount = 10000000;
    const unapprovedToken = `${deployer}.unknown-token`;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-ft",
      [Cl.principal(unapprovedToken), Cl.uint(amount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CONTRACT_NOT_APPROVED));
  });

  it("withdraw-ft() succeeds and transfers FT to the owner", () => {
    // arrange
    const sbtcAmount = 100000;

    // get sBTC from the faucet
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));

    // approve the contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(SBTC_CONTRACT)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // deposit ft so we can withdraw
    const depositReceipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(sbtcAmount)],
      deployer
    );
    expect(depositReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(sbtcAmount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("withdraw-ft() emits the correct notification event", () => {
    // arrange
    const amount = 2000;
    const expectedEvent = {
      notification: "aibtc-agent-account/withdraw-ft",
      payload: {
        amount: amount.toString(),
        assetContract: SBTC_CONTRACT,
        sender: contractAddress,
        caller: deployer,
        recipient: deployer,
      },
    };

    // get sBTC from the faucet
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));

    // approve the contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(SBTC_CONTRACT)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // deposit ft so we can withdraw
    const depositReceipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(amount)],
      deployer
    );
    expect(depositReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(amount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // approve-contract() tests
  ////////////////////////////////////////
  it("approve-contract() fails if caller is not authorized", () => {
    // arrange
    const newContract = `${deployer}.unknown-token`;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(newContract)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("approve-contract() succeeds and sets new approved contract", () => {
    // arrange
    const newContract = `${deployer}.new-token`;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(newContract)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // verify the contract is now approved
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-contract",
      [Cl.principal(newContract)],
      deployer
    );
    expect(isApproved.result).toStrictEqual(Cl.bool(true));
  });

  it("approve-contract() emits the correct notification event", () => {
    // arrange
    const newContract = `${deployer}.another-token`;
    const expectedEvent = {
      notification: "aibtc-agent-account/approve-contract",
      payload: {
        contract: newContract,
        approved: true,
        sender: deployer,
        caller: deployer,
      },
    };

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(newContract)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // revoke-contract() tests
  ////////////////////////////////////////
  it("revoke-contract() fails if caller is not authorized", () => {
    // arrange
    const contract = `${deployer}.unknown-token`;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "revoke-contract",
      [Cl.principal(contract)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("revoke-contract() succeeds and removes approved contract", () => {
    // arrange
    const contract = `${deployer}.unknown-token`;

    // approve the contract first
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(contract)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "revoke-contract",
      [Cl.principal(contract)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // verify the contract is now revoked
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-contract",
      [Cl.principal(contract)],
      deployer
    );
    expect(isApproved.result).toStrictEqual(Cl.bool(false));
  });

  it("revoke-contract() emits the correct notification event", () => {
    // arrange
    const contract = `${deployer}.unknown-token`;
    const expectedEvent = {
      notification: "aibtc-agent-account/revoke-contract",
      payload: {
        contract: contract,
        approved: false,
        sender: deployer,
        caller: deployer,
      },
    };

    // approve the contract first
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(contract)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "revoke-contract",
      [Cl.principal(contract)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // create-action-proposal() tests
  ////////////////////////////////////////
  it("create-action-proposal() fails if caller is not authorized (user or agent)", () => {
    // arrange
    const message = Cl.stringUtf8("hello world");
    setupAgentAccount(deployer);

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
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("create-action-proposal() succeeds when called by owner", () => {
    // arrange
    const message = Cl.stringUtf8("hello world");
    setupAgentAccount(deployer);
    fundVoters([deployer]);
    constructDao(deployer);

    // approve the proposal contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(actionProposalsContractAddress)],
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

  it("create-action-proposal() emits the correct notification event", () => {
    // arrange
    const message = Cl.stringUtf8("hello world");
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
    setupAgentAccount(deployer);
    fundVoters([deployer]);
    constructDao(deployer);

    // approve the proposal contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(actionProposalsContractAddress)],
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

  it("vote-on-action-proposal() succeeds when called by owner", () => {
    // arrange
    const proposalId = 1;
    const vote = true;
    setupAgentAccount(deployer);
    fundVoters([deployer]);
    constructDao(deployer);

    // approve the proposal contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(actionProposalsContractAddress)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // Create a proposal first
    const message = Cl.stringUtf8("hello world");
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
    setupAgentAccount(deployer);
    fundVoters([deployer]);
    constructDao(deployer);

    // approve the proposal contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(actionProposalsContractAddress)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // Create a proposal first
    const message = Cl.stringUtf8("hello world");
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
  it("veto-action-proposal() succeeds when called by owner", () => {
    // arrange
    const proposalId = 1;
    setupAgentAccount(deployer);
    fundVoters([deployer]);
    constructDao(deployer);

    // approve the proposal contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(actionProposalsContractAddress)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // Create a proposal first
    const message = Cl.stringUtf8("hello world");
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
    setupAgentAccount(deployer);
    fundVoters([deployer]);
    constructDao(deployer);

    // approve the proposal contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(actionProposalsContractAddress)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // Create a proposal first
    const message = Cl.stringUtf8("hello world");
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

  it("conclude-action-proposal() succeeds when called by owner", () => {
    // arrange
    const proposalId = 1;
    setupAgentAccount(deployer);
    fundVoters([deployer]);
    constructDao(deployer);

    // approve the proposal contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(actionProposalsContractAddress)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // Create a proposal first
    const message = Cl.stringUtf8("hello world");
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
    setupAgentAccount(deployer);
    fundVoters([deployer]);
    constructDao(deployer);

    // approve the proposal contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(actionProposalsContractAddress)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // Create a proposal first
    const message = Cl.stringUtf8("hello world");
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
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // set-agent-can-use-proposals() tests
  ////////////////////////////////////////
  it("set-agent-can-use-proposals() fails if caller is not the owner", () => {
    // arrange
    const canUseProposals = true;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-use-proposals",
      [Cl.bool(canUseProposals)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CALLER_NOT_OWNER));
  });

  it("set-agent-can-use-proposals() succeeds and sets agent permission", () => {
    // arrange
    const canUseProposals = true;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-use-proposals",
      [Cl.bool(canUseProposals)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("set-agent-can-use-proposals() emits the correct notification event", () => {
    // arrange
    const canUseProposals = true;
    const expectedEvent = {
      notification: "aibtc-agent-account/set-agent-can-use-proposals",
      payload: {
        canUseProposals: canUseProposals,
        sender: deployer,
        caller: deployer,
      },
    };

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-use-proposals",
      [Cl.bool(canUseProposals)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // set-agent-can-approve-revoke-contracts() tests
  ////////////////////////////////////////
  it("set-agent-can-approve-revoke-contracts() fails if caller is not the owner", () => {
    // arrange
    const canApproveRevoke = true;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-approve-revoke-contracts",
      [Cl.bool(canApproveRevoke)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CALLER_NOT_OWNER));
  });

  it("set-agent-can-approve-revoke-contracts() succeeds and sets agent permission", () => {
    // arrange
    const canApproveRevoke = true;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-approve-revoke-contracts",
      [Cl.bool(canApproveRevoke)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("set-agent-can-approve-revoke-contracts() emits the correct notification event", () => {
    // arrange
    const canApproveRevoke = true;
    const expectedEvent = {
      notification:
        "aibtc-agent-account/set-agent-can-approve-revoke-contracts",
      payload: {
        canApproveRevokeContracts: canApproveRevoke,
        sender: deployer,
        caller: deployer,
      },
    };

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-approve-revoke-contracts",
      [Cl.bool(canApproveRevoke)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // set-agent-can-buy-sell-assets() tests
  ////////////////////////////////////////
  it("set-agent-can-buy-sell-assets() fails if caller is not the owner", () => {
    // arrange
    const canBuySell = true;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-buy-sell-assets",
      [Cl.bool(canBuySell)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CALLER_NOT_OWNER));
  });

  it("set-agent-can-buy-sell-assets() succeeds and sets agent permission", () => {
    // arrange
    const canBuySell = true;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-buy-sell-assets",
      [Cl.bool(canBuySell)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("set-agent-can-buy-sell-assets() emits the correct notification event", () => {
    // arrange
    const canBuySell = true;
    const expectedEvent = {
      notification: "aibtc-agent-account/set-agent-can-buy-sell-assets",
      payload: {
        canBuySell: canBuySell,
        sender: deployer,
        caller: deployer,
      },
    };

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-buy-sell-assets",
      [Cl.bool(canBuySell)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // faktory-buy-asset() tests
  ////////////////////////////////////////
  it("faktory-buy-asset() fails if caller is not authorized", () => {
    // arrange
    setupAgentAccount(deployer);
    const amount = 10000000;
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "faktory-buy-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("faktory-buy-asset() fails if agent can't buy/sell", () => {
    // arrange
    setupAgentAccount(deployer);
    const amount = 10000000;
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "faktory-buy-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      address2 // agent address
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("faktory-buy-asset() fails if dex contract is not approved", () => {
    // arrange
    setupAgentAccount(deployer);
    const amount = 10000000;
    const dex = `${deployer}.unknown-dex`;
    const asset = daoTokenAddress;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "faktory-buy-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CONTRACT_NOT_APPROVED));
  });

  it("faktory-buy-asset() succeeds when called by owner with approved contract", () => {
    // arrange
    setupAgentAccount(deployer);
    const amount = 1000000;
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;

    // Approve the dex contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(dex)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "faktory-buy-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("faktory-buy-asset() emits the correct notification event", () => {
    // arrange
    setupAgentAccount(deployer);
    const amount = "1000000";
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;
    const expectedEvent = {
      notification: "aibtc-agent-account/faktory-buy-asset",
      payload: {
        dexContract: dex,
        asset: asset,
        amount: amount,
        sender: deployer,
        caller: deployer,
      },
    };

    // Approve the dex contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(dex)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "faktory-buy-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // faktory-sell-asset() tests
  ////////////////////////////////////////
  it("faktory-sell-asset() fails if caller is not authorized", () => {
    // arrange
    setupAgentAccount(deployer);
    const amount = 10000000;
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "faktory-sell-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("faktory-sell-asset() fails if agent can't buy/sell", () => {
    // arrange
    setupAgentAccount(deployer);
    const amount = 10000000;
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;

    // disable agent buy/sell
    const permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-buy-sell-assets",
      [Cl.bool(false)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "faktory-sell-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      address2 // agent address
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("faktory-sell-asset() fails if dex contract is not approved", () => {
    // arrange
    setupAgentAccount(deployer);
    const amount = 10000000;
    const dex = `${deployer}.unknown-dex`;
    const asset = daoTokenAddress;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "faktory-sell-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CONTRACT_NOT_APPROVED));
  });

  it("faktory-sell-asset() succeeds when called by owner with approved contract", () => {
    // arrange
    setupAgentAccount(deployer);

    // Get the actual balance of the agent account
    const agentBalances = getBalancesForPrincipal(contractAddress);
    const agentDaoTokenBalance = agentBalances.get(DAO_TOKEN_ASSETS_MAP)!;
    expect(agentDaoTokenBalance).toBeGreaterThan(0);

    // Approve the dex contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(tokenDexContractAddress)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "faktory-sell-asset",
      [
        Cl.principal(tokenDexContractAddress),
        Cl.principal(daoTokenAddress),
        Cl.uint(agentDaoTokenBalance),
      ],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("faktory-sell-asset() emits the correct notification event", () => {
    // arrange
    setupAgentAccount(deployer);

    const agentBalances = getBalancesForPrincipal(contractAddress);
    const agentDaoTokenBalance = agentBalances.get(DAO_TOKEN_ASSETS_MAP)!;
    expect(agentDaoTokenBalance).toBeGreaterThan(0);

    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;
    const expectedEvent = {
      notification: "aibtc-agent-account/faktory-sell-asset",
      payload: {
        dexContract: dex,
        asset: asset,
        amount: agentDaoTokenBalance.toString(),
        sender: deployer,
        caller: deployer,
      },
    };

    // Approve the dex contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(dex)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "faktory-sell-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(agentDaoTokenBalance)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    expect(printEvent).toStrictEqual(expectedEvent);
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // is-approved-contract() tests
  ////////////////////////////////////////
  it("is-approved-contract() returns expected values for a contract", () => {
    // arrange
    const contract = `${deployer}.unknown-token`;

    // act
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-contract",
      [Cl.principal(contract)],
      deployer
    );

    // assert
    expect(isApproved.result).toStrictEqual(Cl.bool(false));

    // approve the contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(contract)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const isApproved2 = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-contract",
      [Cl.principal(contract)],
      deployer
    );

    // assert
    expect(isApproved2.result).toStrictEqual(Cl.bool(true));

    // revoke the contract
    const revokeReceipt = simnet.callPublicFn(
      contractAddress,
      "revoke-contract",
      [Cl.principal(contract)],
      deployer
    );
    expect(revokeReceipt.result).toBeOk(Cl.bool(true));

    // act
    const isApproved3 = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-contract",
      [Cl.principal(contract)],
      deployer
    );

    // assert
    expect(isApproved3.result).toStrictEqual(Cl.bool(false));
  });

  ////////////////////////////////////////
  // get-configuration() tests
  ////////////////////////////////////////
  it("get-configuration() returns the correct configuration", () => {
    // arrange
    const expectedConfig = {
      account: contractAddress,
      agent: address2,
      owner: deployer,
    };

    // act
    const configCV = simnet.callReadOnlyFn(
      contractAddress,
      "get-configuration",
      [],
      deployer
    );

    // Convert the Clarity value to a JavaScript object
    const config = configCV.result;
    if (config.type !== ClarityType.Tuple) {
      throw new Error("returned object is not a tuple");
    }

    // Convert the TupleCV to a plain object
    const configTuple = config.value;
    const configData = Object.fromEntries(
      Object.entries(configTuple).map(
        ([key, value]: [string, ClarityValue]) => [key, cvToValue(value, true)]
      )
    );

    // assert
    expect(configData).toEqual(expectedConfig);
  });

  it("agent can buy/sell assets when authorized and fails when revoked", () => {
    // arrange
    setupAgentAccount(deployer);
    const amount = 1000000;
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;

    // Approve the dex contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(dex)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // Enable agent buy/sell
    let permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-buy-sell-assets",
      [Cl.bool(true)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));

    // act - agent calls buy function
    const receipt = simnet.callPublicFn(
      contractAddress,
      "faktory-buy-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      address2 // agent address
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // Revoke agent buy/sell
    permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-buy-sell-assets",
      [Cl.bool(false)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));

    // act - agent calls buy function again
    const receipt2 = simnet.callPublicFn(
      contractAddress,
      "faktory-buy-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      address2 // agent address
    );

    // assert
    expect(receipt2.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("agent can use proposals when authorized and fails when revoked", () => {
    // arrange
    let proposalId = 1;
    const vote = true;
    setupAgentAccount(deployer);
    fundVoters([deployer]);
    constructDao(deployer);

    // Owner approves the proposal contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(actionProposalsContractAddress)],
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
    const message = Cl.stringUtf8("hello world");
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

  it("agent can approve/revoke contracts when authorized and fails when revoked", () => {
    // arrange
    const newContract = `${deployer}.some-new-contract`;
    const anotherContract = `${deployer}.another-new-contract`;

    // Owner enables agent to approve/revoke contracts
    let permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-approve-revoke-contracts",
      [Cl.bool(true)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));

    // act - agent approves a contract
    const receipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(newContract)],
      address2 // agent address
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-contract",
      [Cl.principal(newContract)],
      deployer
    );
    expect(isApproved.result).toStrictEqual(Cl.bool(true));

    // Revoke agent permission
    permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-approve-revoke-contracts",
      [Cl.bool(false)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));

    // act - agent tries to approve another contract
    const receipt2 = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(anotherContract)],
      address2 // agent address
    );

    // assert
    expect(receipt2.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });
});
