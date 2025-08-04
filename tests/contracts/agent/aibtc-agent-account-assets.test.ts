import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeAgentAccount } from "../../../utilities/contract-error-codes";
import { AgentAccountApprovalType } from "../../../utilities/dao-types";
import { setupFullContractRegistry } from "../../../utilities/contract-registry";
import {
  convertSIP019PrintEvent,
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

// import error codes
const ErrCode = ErrCodeAgentAccount;

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // deposit-stx() tests
  ////////////////////////////////////////
  it("deposit-stx() fails if caller is not authorized", () => {
    // arrange
    const amount = 1000000; // 1 STX

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-stx",
      [Cl.uint(amount)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("deposit-stx() fails for agent if permission is revoked", () => {
    // arrange
    const amount = 1000000; // 1 STX

    // act
    // revoke permission
    const revokeReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-manage-assets",
      [Cl.bool(false)],
      deployer
    );
    expect(revokeReceipt.result).toBeOk(Cl.bool(true));

    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-stx",
      [Cl.uint(amount)],
      address2 // agent
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("deposit-stx() succeeds for agent if permission is granted", () => {
    // arrange
    const amount = 1000000; // 1 STX

    // act
    // ensure permission is granted
    const grantReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-manage-assets",
      [Cl.bool(true)],
      deployer
    );
    expect(grantReceipt.result).toBeOk(Cl.bool(true));

    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-stx",
      [Cl.uint(amount)],
      address2 // agent
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

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
    dbgLog(printEvent, { titleBefore: "deposit-stx() event" });
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // deposit-ft() tests
  ////////////////////////////////////////
  it("deposit-ft() fails if caller is not authorized", () => {
    // arrange
    const amount = 10000000;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(amount)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("deposit-ft() fails for agent if permission is revoked", () => {
    // arrange
    const amount = 10000000;

    // act
    // revoke permission
    const revokeReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-manage-assets",
      [Cl.bool(false)],
      deployer
    );
    expect(revokeReceipt.result).toBeOk(Cl.bool(true));

    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(amount)],
      address2 // agent
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("deposit-ft() succeeds for agent if permission is granted", () => {
    // arrange
    const amount = 10000000;

    // act
    // ensure permission is granted
    const grantReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-manage-assets",
      [Cl.bool(true)],
      deployer
    );
    expect(grantReceipt.result).toBeOk(Cl.bool(true));

    // get sBTC from the faucet for the agent
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      address2 // agent
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));

    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(amount)],
      address2 // agent
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
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

    // verify the contract is now approved
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-contract",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(AgentAccountApprovalType.TOKEN)],
      deployer
    );
    expect(isApproved.result).toStrictEqual(Cl.bool(true));
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
    dbgLog(printEvent, { titleBefore: "deposit-ft() event" });
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // withdraw-stx() tests
  ////////////////////////////////////////
  it("withdraw-stx() fails if caller is not authorized", () => {
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
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("withdraw-stx() fails for agent if permission is revoked", () => {
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
    // revoke permission
    const revokeReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-manage-assets",
      [Cl.bool(false)],
      deployer
    );
    expect(revokeReceipt.result).toBeOk(Cl.bool(true));

    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-stx",
      [Cl.uint(amount)],
      address2 // agent
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("withdraw-stx() succeeds for agent if permission is granted", () => {
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
    // ensure permission is granted
    const grantReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-manage-assets",
      [Cl.bool(true)],
      deployer
    );
    expect(grantReceipt.result).toBeOk(Cl.bool(true));

    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-stx",
      [Cl.uint(amount)],
      address2 // agent
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
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
    dbgLog(printEvent, { titleBefore: "withdraw-stx() event" });
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // withdraw-ft() tests
  ////////////////////////////////////////
  it("withdraw-ft() fails if caller is not authorized", () => {
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
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("withdraw-ft() fails for agent if permission is revoked", () => {
    // arrange
    const amount = 10000000;

    // deposit ft so we can withdraw
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    const depositReceipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(amount)],
      deployer
    );
    expect(depositReceipt.result).toBeOk(Cl.bool(true));

    // act
    // revoke permission
    const revokeReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-manage-assets",
      [Cl.bool(false)],
      deployer
    );
    expect(revokeReceipt.result).toBeOk(Cl.bool(true));

    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(amount)],
      address2 // agent
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("withdraw-ft() succeeds for agent if permission is granted", () => {
    // arrange
    const amount = 10000000;

    // deposit ft so we can withdraw
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      deployer
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    const depositReceipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(amount)],
      deployer
    );
    expect(depositReceipt.result).toBeOk(Cl.bool(true));

    // act
    // ensure permission is granted
    const grantReceipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-manage-assets",
      [Cl.bool(true)],
      deployer
    );
    expect(grantReceipt.result).toBeOk(Cl.bool(true));

    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-ft",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(amount)],
      address2 // agent
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
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
    dbgLog(printEvent, { titleBefore: "withdraw-ft() event" });
    expect(printEvent).toStrictEqual(expectedEvent);
  });
});
