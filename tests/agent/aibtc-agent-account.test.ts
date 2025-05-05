import {
  Cl,
  ClarityType,
  ClarityValue,
  cvToValue,
  TupleCV,
} from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeAgentAccount } from "../utilities/contract-error-codes";
import {
  setupFullContractRegistry,
  setupDaoContractRegistry,
} from "../utilities/contract-registry";
import {
  convertSIP019PrintEvent,
  SBTC_CONTRACT,
} from "../utilities/contract-helpers";
import { printAssetsMap } from "../utilities/clarinet-helpers";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!; // agent
const address3 = accounts.get("wallet_3")!;

// setup contract info for tests
const registry = setupFullContractRegistry();
const daoRegistry = setupDaoContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "AGENT",
  "AGENT_ACCOUNT"
);
const contractName = contractAddress.split(".")[1];

// DAO contract references
const daoTokenAddress = daoRegistry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "DAO"
);
const tokenDexContractAddress = daoRegistry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "DEX"
);
const baseDaoContractAddress = daoRegistry.getContractAddressByTypeAndSubtype(
  "BASE",
  "DAO"
);
const actionProposalsContractAddress =
  daoRegistry.getContractAddressByTypeAndSubtype(
    "EXTENSIONS",
    "ACTION_PROPOSAL_VOTING"
  );
const sendMessageActionContractAddress =
  daoRegistry.getContractAddressByTypeAndSubtype("ACTIONS", "SEND_MESSAGE");

// import error codes
const ErrCode = ErrCodeAgentAccount;

// Helper function to set up the account for testing
function setupAccount(sender: string, satsAmount: number = 1000000) {
  // get sBTC from the faucet
  const faucetReceipt = simnet.callPublicFn(
    SBTC_CONTRACT,
    "faucet",
    [],
    sender
  );
  expect(faucetReceipt.result).toBeOk(Cl.bool(true));

  // get dao tokens from the dex
  const dexReceipt = simnet.callPublicFn(
    tokenDexContractAddress,
    "buy",
    [Cl.principal(daoTokenAddress), Cl.uint(satsAmount)],
    sender
  );
  expect(dexReceipt.result).toBeOk(Cl.bool(true));

  // get our balances from the assets map
  const balancesMap = simnet.getAssetsMap();
  const aibtcKey = daoTokenAddress.split(".")[1];
  const sbtcKey = SBTC_CONTRACT.split(".")[1];
  const stxKey = "STX";

  // deposit sBTC to the agent account
  const depositReceiptSbtc = simnet.callPublicFn(
    contractAddress,
    "deposit-ft",
    [Cl.principal(SBTC_CONTRACT), Cl.uint(satsAmount)],
    sender
  );
  expect(depositReceiptSbtc.result).toBeOk(Cl.bool(true));

  // deposit DAO tokens to the agent account
  const depositReceiptDao = simnet.callPublicFn(
    contractAddress,
    "deposit-ft",
    [Cl.principal(daoTokenAddress), Cl.uint(satsAmount)],
    sender
  );
  expect(depositReceiptDao.result).toBeOk(Cl.bool(true));
}

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // deposit-stx() tests
  ////////////////////////////////////////
  it("deposit-stx() succeeds and deposits STX to the account", () => {
    // arrange
    printAssetsMap(simnet.getAssetsMap());
    const amount = 1000000; // 1 STX

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-stx",
      [Cl.uint(amount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    printAssetsMap(simnet.getAssetsMap());
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
  it("deposit-ft() fails if asset is not approved", () => {
    // arrange
    const amount = 10000000;
    const unapprovedToken = `${deployer}.test-token`;

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
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNKNOWN_ASSET));
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
        sender: deployer,
        caller: deployer,
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
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
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
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("withdraw-ft() fails if asset is not approved", () => {
    // arrange
    const amount = 10000000;
    const unapprovedToken = `${deployer}.test-token`;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-ft",
      [Cl.principal(unapprovedToken), Cl.uint(amount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNKNOWN_ASSET));
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
  // approve-asset() tests
  ////////////////////////////////////////
  it("approve-asset() fails if caller is not the owner", () => {
    // arrange
    const newAsset = `${deployer}.test-token`;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "approve-asset",
      [Cl.principal(newAsset)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("approve-asset() succeeds and sets new approved asset", () => {
    // arrange
    const newAsset = `${deployer}.new-token`;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "approve-asset",
      [Cl.principal(newAsset)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // verify the asset is now approved
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-asset",
      [Cl.principal(newAsset)],
      deployer
    );
    expect(isApproved.result).toStrictEqual(Cl.bool(true));
  });

  it("approve-asset() emits the correct notification event", () => {
    // arrange
    const newAsset = `${deployer}.another-token`;
    const expectedEvent = {
      notification: "aibtc-agent-account/approve-asset",
      payload: {
        asset: newAsset,
        approved: true,
        sender: deployer,
        caller: deployer,
      },
    };

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "approve-asset",
      [Cl.principal(newAsset)],
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
  // revoke-asset() tests
  ////////////////////////////////////////
  it("revoke-asset() fails if caller is not the owner", () => {
    // arrange
    const asset = `${deployer}.test-token`;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "revoke-asset",
      [Cl.principal(asset)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("revoke-asset() succeeds and removes approved asset", () => {
    // arrange
    const asset = `${deployer}.test-token`;

    // approve the asset first
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-asset",
      [Cl.principal(asset)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "revoke-asset",
      [Cl.principal(asset)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // verify the asset is now revoked
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-asset",
      [Cl.principal(asset)],
      deployer
    );
    expect(isApproved.result).toStrictEqual(Cl.bool(false));
  });

  it("revoke-asset() emits the correct notification event", () => {
    // arrange
    const asset = `${deployer}.test-token`;
    const expectedEvent = {
      notification: "aibtc-agent-account/revoke-asset",
      payload: {
        asset: asset,
        approved: false,
        sender: deployer,
        caller: deployer,
      },
    };

    // approve the asset first
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-asset",
      [Cl.principal(asset)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "revoke-asset",
      [Cl.principal(asset)],
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
    const message = Cl.stringAscii("hello world");

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        Cl.buffer(Cl.serialize(message)),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("create-action-proposal() succeeds when called by owner", () => {
    // arrange
    const message = Cl.stringAscii("hello world");
    setupAccount(deployer);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        Cl.buffer(Cl.serialize(message)),
        Cl.some(Cl.stringAscii("Test memo")),
      ],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("create-action-proposal() emits the correct notification event", () => {
    // arrange
    const message = Cl.stringAscii("hello world");
    const expectedEvent = {
      notification: "aibtc-agent-account/create-action-proposal",
      payload: {
        proposalContract: actionProposalsContractAddress,
        action: sendMessageActionContractAddress,
        parameters: cvToValue(Cl.buffer(Cl.serialize(message))),
        sender: deployer,
        caller: deployer,
      },
    };
    setupAccount(deployer);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionProposalsContractAddress),
        Cl.principal(sendMessageActionContractAddress),
        Cl.buffer(Cl.serialize(message)),
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
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
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
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  ////////////////////////////////////////
  // acct-approve-dex() tests
  ////////////////////////////////////////
  it("acct-approve-dex() fails if caller is not the owner", () => {
    // arrange
    const dex = `${deployer}.test-dex-1`;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-approve-dex",
      [Cl.principal(dex)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("acct-approve-dex() succeeds and sets new approved dex", () => {
    // arrange
    const dex = `${deployer}.test-dex-1`;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-approve-dex",
      [Cl.principal(dex)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // verify the dex is now approved
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-dex",
      [Cl.principal(dex)],
      deployer
    );
    expect(isApproved.result).toStrictEqual(Cl.bool(true));
  });

  it("acct-approve-dex() emits the correct notification event", () => {
    // arrange
    const dex = `${deployer}.test-dex-2`;
    const expectedEvent = {
      notification: "aibtc-agent-account/acct-approve-dex",
      payload: {
        dexContract: dex,
        approved: true,
        sender: deployer,
        caller: deployer,
      },
    };

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-approve-dex",
      [Cl.principal(dex)],
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
  // acct-revoke-dex() tests
  ////////////////////////////////////////
  it("acct-revoke-dex() fails if caller is not the owner", () => {
    // arrange
    const dex = `${deployer}.test-dex-1`;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-revoke-dex",
      [Cl.principal(dex)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("acct-revoke-dex() succeeds and removes approved dex", () => {
    // arrange
    const dex = `${deployer}.test-dex-1`;

    // approve the dex first
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "acct-approve-dex",
      [Cl.principal(dex)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-revoke-dex",
      [Cl.principal(dex)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // verify the dex is now revoked
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-dex",
      [Cl.principal(dex)],
      deployer
    );
    expect(isApproved.result).toStrictEqual(Cl.bool(false));
  });

  it("acct-revoke-dex() emits the correct notification event", () => {
    // arrange
    const dex = `${deployer}.test-dex-1`;
    const expectedEvent = {
      notification: "aibtc-agent-account/acct-revoke-dex",
      payload: {
        dexContract: dex,
        approved: false,
        sender: deployer,
        caller: deployer,
      },
    };

    // approve the dex first
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "acct-approve-dex",
      [Cl.principal(dex)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-revoke-dex",
      [Cl.principal(dex)],
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
  // set-agent-can-buy-sell() tests
  ////////////////////////////////////////
  it("set-agent-can-buy-sell() fails if caller is not the owner", () => {
    // arrange
    const canBuySell = true;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-buy-sell",
      [Cl.bool(canBuySell)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("set-agent-can-buy-sell() succeeds and sets agent permission", () => {
    // arrange
    const canBuySell = true;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-buy-sell",
      [Cl.bool(canBuySell)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("set-agent-can-buy-sell() emits the correct notification event", () => {
    // arrange
    const canBuySell = true;
    const expectedEvent = {
      notification: "aibtc-agent-account/set-agent-can-buy-sell",
      payload: {
        canBuySell: canBuySell,
        sender: deployer,
        caller: deployer,
      },
    };

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-buy-sell",
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
  // acct-buy-asset() tests
  ////////////////////////////////////////
  it("acct-buy-asset() fails if caller is not authorized", () => {
    // arrange
    const amount = 10000000;
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-buy-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_BUY_SELL_NOT_ALLOWED));
  });

  it("acct-buy-asset() fails if agent can't buy/sell", () => {
    // arrange
    const amount = 10000000;
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-buy-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      address2 // agent address
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_BUY_SELL_NOT_ALLOWED));
  });

  it("acct-buy-asset() fails if dex is not approved", () => {
    // arrange
    const amount = 10000000;
    const dex = `${deployer}.test-dex-1`;
    const asset = daoTokenAddress;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-buy-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNKNOWN_ASSET));
  });

  ////////////////////////////////////////
  // acct-sell-asset() tests
  ////////////////////////////////////////
  it("acct-sell-asset() fails if caller is not authorized", () => {
    // arrange
    const amount = 10000000;
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-sell-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_BUY_SELL_NOT_ALLOWED));
  });

  it("acct-sell-asset() fails if agent can't buy/sell", () => {
    // arrange
    const amount = 10000000;
    const dex = tokenDexContractAddress;
    const asset = daoTokenAddress;

    // disable agent buy/sell
    const permissionReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-buy-sell",
      [Cl.bool(false)],
      deployer
    );
    expect(permissionReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-sell-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      address2 // agent address
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_BUY_SELL_NOT_ALLOWED));
  });

  it("acct-sell-asset() fails if dex is not approved", () => {
    // arrange
    const amount = 10000000;
    const dex = `${deployer}.test-dex-1`;
    const asset = daoTokenAddress;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "acct-sell-asset",
      [Cl.principal(dex), Cl.principal(asset), Cl.uint(amount)],
      deployer
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNKNOWN_ASSET));
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // is-approved-dex() tests
  ////////////////////////////////////////
  it("is-approved-dex() returns expected values for a dex", () => {
    // arrange
    const dex = `${deployer}.test-dex-1`;

    // act
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-dex",
      [Cl.principal(dex)],
      deployer
    );

    // assert
    expect(isApproved.result).toStrictEqual(Cl.bool(false));

    // approve the dex
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "acct-approve-dex",
      [Cl.principal(dex)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const isApproved2 = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-dex",
      [Cl.principal(dex)],
      deployer
    );

    // assert
    expect(isApproved2.result).toStrictEqual(Cl.bool(true));

    // revoke the dex
    const revokeReceipt = simnet.callPublicFn(
      contractAddress,
      "acct-revoke-dex",
      [Cl.principal(dex)],
      deployer
    );
    expect(revokeReceipt.result).toBeOk(Cl.bool(true));

    // act
    const isApproved3 = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-dex",
      [Cl.principal(dex)],
      deployer
    );

    // assert
    expect(isApproved3.result).toStrictEqual(Cl.bool(false));
  });

  ////////////////////////////////////////
  // is-approved-asset() tests
  ////////////////////////////////////////
  it("is-approved-asset() returns expected values for an asset", () => {
    // arrange
    const asset = `${deployer}.test-token`;

    // act
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-asset",
      [Cl.principal(asset)],
      deployer
    );

    // assert
    expect(isApproved.result).toStrictEqual(Cl.bool(false));

    // approve the asset
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-asset",
      [Cl.principal(asset)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const isApproved2 = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-asset",
      [Cl.principal(asset)],
      deployer
    );

    // assert
    expect(isApproved2.result).toStrictEqual(Cl.bool(true));

    // revoke the asset
    const revokeReceipt = simnet.callPublicFn(
      contractAddress,
      "revoke-asset",
      [Cl.principal(asset)],
      deployer
    );
    expect(revokeReceipt.result).toBeOk(Cl.bool(true));

    // act
    const isApproved3 = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-asset",
      [Cl.principal(asset)],
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
      daoToken: daoTokenAddress,
      daoTokenDex: tokenDexContractAddress,
      sbtcToken: SBTC_CONTRACT,
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
    const configTuple = config.data;
    const configData = Object.fromEntries(
      Object.entries(configTuple).map(
        ([key, value]: [string, ClarityValue]) => [key, cvToValue(value, true)]
      )
    );

    // assert
    expect(configData).toEqual(expectedConfig);
  });
});
