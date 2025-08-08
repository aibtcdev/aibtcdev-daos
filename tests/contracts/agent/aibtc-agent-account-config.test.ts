import { Cl, ClarityType, ClarityValue, cvToValue } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeAgentAccount } from "../../../utilities/contract-error-codes";
import {
  AGENT_ACCOUNT_APPROVAL_TYPES,
  AgentAccountApprovalTypes,
  AgentAccountConfiguration,
  AgentAccountPermissions,
} from "../../../utilities/agent-account-types";
import { setupFullContractRegistry } from "../../../utilities/contract-registry";
import {
  convertClarityTuple,
  convertSIP019PrintEvent,
  SBTC_CONTRACT,
} from "../../../utilities/contract-helpers";
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
  // approve-contract() tests
  ////////////////////////////////////////
  it("approve-contract() fails if caller is not authorized", () => {
    // arrange
    const newContract = `${deployer}.unknown-token`;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(newContract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
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
      [Cl.principal(newContract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // verify the contract is now approved
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-contract",
      [Cl.principal(newContract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
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
        type: AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN.toString(),
        approved: true,
        sender: deployer,
        caller: deployer,
      },
    };

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(newContract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    dbgLog(printEvent, { titleBefore: "approve-contract() event" });
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
      [Cl.principal(contract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
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
      [Cl.principal(contract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "revoke-contract",
      [Cl.principal(contract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // verify the contract is now revoked
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-contract",
      [Cl.principal(contract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
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
        type: AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN.toString(),
        approved: false,
        sender: deployer,
        caller: deployer,
      },
    };

    // approve the contract first
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(contract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "revoke-contract",
      [Cl.principal(contract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    dbgLog(printEvent, { titleBefore: "revoke-contract() event" });
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  it("revoke-contract() succeeds for agent if permission is granted", () => {
    // arrange
    const contract = `${deployer}.contract-to-revoke-by-agent`;
    // approve the contract first by owner
    simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(contract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
      deployer
    );
    // enable agent to revoke
    simnet.callPublicFn(
      contractAddress,
      "set-agent-can-approve-revoke-contracts",
      [Cl.bool(true)],
      deployer
    );

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "revoke-contract",
      [Cl.principal(contract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
      address2 // agent
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-contract",
      [Cl.principal(contract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
      deployer
    );
    expect(isApproved.result).toStrictEqual(Cl.bool(false));
  });

  it("revoke-contract() fails for agent if permission is not granted", () => {
    // arrange
    const contract = `${deployer}.another-contract-to-revoke-by-agent`;
    // approve the contract first by owner
    simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(contract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
      deployer
    );
    // disable agent to revoke
    simnet.callPublicFn(
      contractAddress,
      "set-agent-can-approve-revoke-contracts",
      [Cl.bool(false)],
      deployer
    );

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "revoke-contract",
      [Cl.principal(contract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
      address2 // agent
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });

  ////////////////////////////////////////
  // set-agent-can-manage-assets() tests
  ////////////////////////////////////////
  it("set-agent-can-manage-assets() fails if caller is not the owner", () => {
    // arrange
    const canManage = false;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-manage-assets",
      [Cl.bool(canManage)],
      address3
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CALLER_NOT_OWNER));
  });

  it("set-agent-can-manage-assets() succeeds and sets agent permission", () => {
    // arrange
    const canManage = false;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-manage-assets",
      [Cl.bool(canManage)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("set-agent-can-manage-assets() emits the correct notification event", () => {
    // arrange
    const canManage = false;
    const expectedEvent = {
      notification: "aibtc-agent-account/set-agent-can-manage-assets",
      payload: {
        canManageAssets: canManage,
        sender: deployer,
        caller: deployer,
      },
    };

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-agent-can-manage-assets",
      [Cl.bool(canManage)],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const event = receipt.events[0];
    expect(event).toBeDefined();
    const printEvent = convertSIP019PrintEvent(receipt.events[0]);
    dbgLog(printEvent, { titleBefore: "set-agent-can-manage-assets() event" });
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
    dbgLog(printEvent, { titleBefore: "set-agent-can-use-proposals() event" });
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
    dbgLog(printEvent, {
      titleBefore: "set-agent-can-approve-revoke-contracts() event",
    });
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
    dbgLog(printEvent, {
      titleBefore: "set-agent-can-buy-sell-assets() event",
    });
    expect(printEvent).toStrictEqual(expectedEvent);
  });

  ////////////////////////////////////////
  // get-config() tests
  ////////////////////////////////////////
  it("get-config() returns the correct configuration", () => {
    // arrange
    const expectedConfig: AgentAccountConfiguration = {
      account: contractAddress,
      agent: address2,
      owner: deployer,
      sbtc: SBTC_CONTRACT,
    };

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "get-config",
      [],
      deployer
    );

    // assert
    expect(receipt.result.type).toBe(ClarityType.ResponseOk);
    const configData = convertClarityTuple<AgentAccountConfiguration>(
      (receipt.result as any).value
    );
    expect(configData).toEqual(expectedConfig);
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
      [Cl.principal(contract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
      deployer
    );

    // assert
    expect(isApproved.result).toStrictEqual(Cl.bool(false));

    // approve the contract
    const approveReceipt = simnet.callPublicFn(
      contractAddress,
      "approve-contract",
      [Cl.principal(contract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
      deployer
    );
    expect(approveReceipt.result).toBeOk(Cl.bool(true));

    // act
    const isApproved2 = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-contract",
      [Cl.principal(contract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
      deployer
    );

    // assert
    expect(isApproved2.result).toStrictEqual(Cl.bool(true));

    // revoke the contract
    const revokeReceipt = simnet.callPublicFn(
      contractAddress,
      "revoke-contract",
      [Cl.principal(contract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
      deployer
    );
    expect(revokeReceipt.result).toBeOk(Cl.bool(true));

    // act
    const isApproved3 = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-contract",
      [Cl.principal(contract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
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
    const expectedConfig: AgentAccountConfiguration = {
      account: contractAddress,
      agent: address2,
      owner: deployer,
      sbtc: SBTC_CONTRACT,
    };

    // act
    const configCV = simnet.callReadOnlyFn(
      contractAddress,
      "get-configuration",
      [],
      deployer
    );

    // assert
    const configData = convertClarityTuple<AgentAccountConfiguration>(
      configCV.result
    );
    expect(configData).toEqual(expectedConfig);
  });

  ////////////////////////////////////////
  // get-approval-types() tests
  ////////////////////////////////////////
  it("get-approval-types() returns the correct approval types", () => {
    // arrange
    const expectedTypes: AgentAccountApprovalTypes = {
      proposalVoting: BigInt(AGENT_ACCOUNT_APPROVAL_TYPES.VOTING),
      swap: BigInt(AGENT_ACCOUNT_APPROVAL_TYPES.SWAP),
      token: BigInt(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN),
    };

    // act
    const typesCV = simnet.callReadOnlyFn(
      contractAddress,
      "get-approval-types",
      [],
      deployer
    );

    // assert
    const typesData = convertClarityTuple<AgentAccountApprovalTypes>(
      typesCV.result
    );
    expect(typesData).toEqual(expectedTypes);
  });

  ////////////////////////////////////////
  // get-agent-permissions() tests
  ////////////////////////////////////////
  it("get-agent-permissions() returns the correct agent permissions", () => {
    // arrange
    const expectedInitialPermissions: AgentAccountPermissions = {
      canManageAssets: true,
      canUseProposals: true,
      canApproveRevokeContracts: true,
      canBuySell: false,
    };

    // act
    const permissionsCV = simnet.callReadOnlyFn(
      contractAddress,
      "get-agent-permissions",
      [],
      deployer
    );

    // assert initial state
    const permissionsData = convertClarityTuple<AgentAccountPermissions>(
      permissionsCV.result
    );
    expect(permissionsData).toEqual(expectedInitialPermissions);

    // arrange - change a permission
    simnet.callPublicFn(
      contractAddress,
      "set-agent-can-buy-sell-assets",
      [Cl.bool(true)],
      deployer
    );

    const expectedUpdatedPermissions: AgentAccountPermissions = {
      ...expectedInitialPermissions,
      canBuySell: true,
    };

    // act again
    const updatedPermissionsCV = simnet.callReadOnlyFn(
      contractAddress,
      "get-agent-permissions",
      [],
      deployer
    );

    // assert updated state
    const updatedPermissionsData = convertClarityTuple<AgentAccountPermissions>(
      updatedPermissionsCV.result
    );
    expect(updatedPermissionsData).toEqual(expectedUpdatedPermissions);
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
      [Cl.principal(newContract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
      address2 // agent address
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const isApproved = simnet.callReadOnlyFn(
      contractAddress,
      "is-approved-contract",
      [Cl.principal(newContract), Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN)],
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
      [
        Cl.principal(anotherContract),
        Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN),
      ],
      address2 // agent address
    );

    // assert
    expect(receipt2.result).toBeErr(Cl.uint(ErrCode.ERR_OPERATION_NOT_ALLOWED));
  });
});
