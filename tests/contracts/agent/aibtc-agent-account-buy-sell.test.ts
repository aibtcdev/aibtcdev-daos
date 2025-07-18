import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeAgentAccount } from "../../../utilities/contract-error-codes";
import { AgentAccountApprovalType } from "../../../utilities/dao-types";
import { setupFullContractRegistry } from "../../../utilities/contract-registry";
import {
  convertSIP019PrintEvent,
  DAO_TOKEN_ASSETS_MAP,
  SBTC_ASSETS_MAP,
  SBTC_CONTRACT,
} from "../../../utilities/contract-helpers";
import { getBalancesForPrincipal } from "../../../utilities/asset-helpers";
import { dbgLog } from "../../../utilities/debug-logging";
import {
  completePrelaunch,
  fundAgentAccount,
} from "../../../utilities/dao-helpers";

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
const faktoryAdapterAddress = registry.getContractAddressByTypeAndSubtype(
  "TRADING",
  "FAKTORY_SBTC"
);

// import error codes
const ErrCode = ErrCodeAgentAccount;

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // buy-dao-token() tests
  ////////////////////////////////////////
  it("buy-dao-token() fails if caller is not authorized", () => {
    // arrange
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    const amount = 10000000;
    const adapter = faktoryAdapterAddress;
    const asset = daoTokenAddress;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-dao-token",
      [Cl.principal(adapter), Cl.principal(asset), Cl.uint(amount), Cl.none()],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("buy-dao-token() fails if agent can't buy/sell", () => {
    // arrange
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    const amount = 10000000;
    const adapter = faktoryAdapterAddress;
    const asset = daoTokenAddress;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-dao-token",
      [Cl.principal(adapter), Cl.principal(asset), Cl.uint(amount), Cl.none()],
      address2 // agent address
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("buy-dao-token() fails if swap adapter contract is not approved", () => {
    // arrange
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    const amount = 10000000;
    const adapter = `${deployer}.unknown-adapter`;
    const asset = daoTokenAddress;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-dao-token",
      [Cl.principal(adapter), Cl.principal(asset), Cl.uint(amount), Cl.none()],
      deployer
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CONTRACT_NOT_APPROVED));
  });

  it("buy-dao-token() fails if dao token contract is not approved", () => {
    // arrange
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    const amount = 10000000;
    const adapter = faktoryAdapterAddress;
    const asset = `${deployer}.unknown-token`;

    // Approve the adapter contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(adapter), Cl.uint(AgentAccountApprovalType.SWAP)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-dao-token",
      [Cl.principal(adapter), Cl.principal(asset), Cl.uint(amount), Cl.none()],
      deployer
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CONTRACT_NOT_APPROVED));
  });

  it("buy-dao-token() succeeds when called by owner with approved contract", () => {
    // arrange
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    const amount = 1000000;
    const adapter = faktoryAdapterAddress;
    const asset = daoTokenAddress;

    // Approve the adapter contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(adapter), Cl.uint(AgentAccountApprovalType.SWAP)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // Approve the token contract
    const approveTokenReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(asset), Cl.uint(AgentAccountApprovalType.TOKEN)],
      deployer
    );
    expect(approveTokenReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-dao-token",
      [Cl.principal(adapter), Cl.principal(asset), Cl.uint(amount), Cl.none()],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("buy-dao-token() emits the correct notification event", () => {
    // arrange
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    const amount = "1000000";
    const adapter = faktoryAdapterAddress;
    const asset = daoTokenAddress;
    const expectedEvent = {
      notification: "aibtc-agent-account/buy-dao-token",
      payload: {
        swapAdapter: adapter,
        daoToken: asset,
        amount: amount,
        minReceive: null,
        sender: deployer,
        caller: deployer,
      },
    };

    // Approve the adapter contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(adapter), Cl.uint(AgentAccountApprovalType.SWAP)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // Approve the token contract
    const approveTokenReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(asset), Cl.uint(AgentAccountApprovalType.TOKEN)],
      deployer
    );
    expect(approveTokenReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-dao-token",
      [Cl.principal(adapter), Cl.principal(asset), Cl.uint(amount), Cl.none()],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    dbgLog(printEvent, { titleBefore: "buy-dao-token() event" });
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // sell-dao-token() tests
  ////////////////////////////////////////
  it("sell-dao-token() fails if caller is not authorized", () => {
    // arrange
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    const amount = 10000000;
    const adapter = faktoryAdapterAddress;
    const asset = daoTokenAddress;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "sell-dao-token",
      [Cl.principal(adapter), Cl.principal(asset), Cl.uint(amount), Cl.none()],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("sell-dao-token() fails if agent can't buy/sell", () => {
    // arrange
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    const amount = 10000000;
    const adapter = faktoryAdapterAddress;
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
      "sell-dao-token",
      [Cl.principal(adapter), Cl.principal(asset), Cl.uint(amount), Cl.none()],
      address2 // agent address
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  it("sell-dao-token() fails if swap adapter contract is not approved", () => {
    // arrange
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    const amount = 10000000;
    const adapter = `${deployer}.unknown-adapter`;
    const asset = daoTokenAddress;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "sell-dao-token",
      [Cl.principal(adapter), Cl.principal(asset), Cl.uint(amount), Cl.none()],
      deployer
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CONTRACT_NOT_APPROVED));
  });

  it("sell-dao-token() fails if dao token contract is not approved", () => {
    // arrange
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    const amount = 10000000;
    const adapter = faktoryAdapterAddress;
    const asset = `${deployer}.unknown-token`;

    // Approve the adapter contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(adapter), Cl.uint(AgentAccountApprovalType.SWAP)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "sell-dao-token",
      [Cl.principal(adapter), Cl.principal(asset), Cl.uint(amount), Cl.none()],
      deployer
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CONTRACT_NOT_APPROVED));
  });

  it("sell-dao-token() succeeds when called by owner with approved contract", () => {
    // arrange
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);

    // Get the actual balance of the agent account
    const agentBalances = getBalancesForPrincipal(contractAddress);
    const agentDaoTokenBalance = agentBalances.get(DAO_TOKEN_ASSETS_MAP)!;
    expect(agentDaoTokenBalance).toBeGreaterThan(0);

    // Approve the adapter contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [
        Cl.principal(faktoryAdapterAddress),
        Cl.uint(AgentAccountApprovalType.SWAP),
      ],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // Approve the token contract
    const approveTokenReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(daoTokenAddress), Cl.uint(AgentAccountApprovalType.TOKEN)],
      deployer
    );
    expect(approveTokenReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "sell-dao-token",
      [
        Cl.principal(faktoryAdapterAddress),
        Cl.principal(daoTokenAddress),
        Cl.uint(agentDaoTokenBalance),
        Cl.none(),
      ],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("sell-dao-token() emits the correct notification event", () => {
    // arrange
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);

    const agentBalances = getBalancesForPrincipal(contractAddress);
    const agentDaoTokenBalance = agentBalances.get(DAO_TOKEN_ASSETS_MAP)!;
    expect(agentDaoTokenBalance).toBeGreaterThan(0);

    const adapter = faktoryAdapterAddress;
    const asset = daoTokenAddress;
    const expectedEvent = {
      notification: "aibtc-agent-account/sell-dao-token",
      payload: {
        swapAdapter: adapter,
        daoToken: asset,
        amount: agentDaoTokenBalance.toString(),
        minReceive: null,
        sender: deployer,
        caller: deployer,
      },
    };

    // Approve the adapter contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(adapter), Cl.uint(AgentAccountApprovalType.SWAP)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // Approve the token contract
    const approveTokenReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(asset), Cl.uint(AgentAccountApprovalType.TOKEN)],
      deployer
    );
    expect(approveTokenReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "sell-dao-token",
      [
        Cl.principal(adapter),
        Cl.principal(asset),
        Cl.uint(agentDaoTokenBalance),
        Cl.none(),
      ],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    dbgLog(printEvent, { titleBefore: "sell-dao-token() event" });
    expect(printEvent).toStrictEqual(expectedEvent);
  });
});

describe(`read-only functions: ${contractName}`, () => {
  it("agent can buy/sell assets when authorized and fails when revoked", () => {
    // arrange
    completePrelaunch(deployer);
    fundAgentAccount(contractAddress, deployer);
    const amount = 1000000;
    const adapter = faktoryAdapterAddress;
    const asset = daoTokenAddress;

    // Approve the adapter contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(adapter), Cl.uint(AgentAccountApprovalType.SWAP)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // Approve the token contract
    const approveTokenReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(asset), Cl.uint(AgentAccountApprovalType.TOKEN)],
      deployer
    );
    expect(approveTokenReceipt.result).toBeOk(Cl.bool(true));

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
      "buy-dao-token",
      [Cl.principal(adapter), Cl.principal(asset), Cl.uint(amount), Cl.none()],
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
      "buy-dao-token",
      [Cl.principal(adapter), Cl.principal(asset), Cl.uint(amount), Cl.none()],
      address2 // agent address
    );

    // assert
    expect(receipt2.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });
});
