import { Cl } from "@stacks/transactions";
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
import { dbgLog } from "../../../utilities/debug-logging";

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

// DAO contract references
const daoTokenAddress = registry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "DAO"
);
const tokenDexContractAddress = registry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "DEX"
);

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
    dbgLog(printEvent, { titleBefore: "faktory-buy-asset() event" });
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
    dbgLog(printEvent, { titleBefore: "faktory-sell-asset() event" });
    expect(printEvent).toStrictEqual(expectedEvent);
  });
});

describe(`read-only functions: ${contractName}`, () => {
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
});
