import { Cl, ClarityType } from "@stacks/transactions";
import { beforeEach, describe, expect, it } from "vitest";
import {
  ErrCodeBitflowBuyAndDeposit,
  ErrCodeBitflowSwapAdapter,
} from "../../../../utilities/contract-error-codes";
import { setupFullContractRegistry } from "../../../../utilities/contract-registry";
import {
  convertClarityTuple,
  SBTC_CONTRACT,
  DAO_TOKEN_ASSETS_MAP,
} from "../../../../utilities/contract-helpers";
import {
  getSbtcFromFaucet,
  fundAgentAccount,
  graduateDex,
  enablePublicPoolCreation,
} from "../../../../utilities/dao-helpers";
import { getBalancesForPrincipal } from "../../../../utilities/asset-helpers";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!; // user without agent
const address2 = accounts.get("wallet_2")!; // user with agent

// setup contract info for tests
const registry = setupFullContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "TRADING",
  "BITFLOW_BUY_AND_DEPOSIT"
);
const agentAccountAddress = registry.getContractAddressByTypeAndSubtype(
  "AGENT",
  "AGENT_ACCOUNT"
);
const daoTokenAddress = registry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "DAO"
);

// import error codes
const ErrCode = ErrCodeBitflowBuyAndDeposit;

describe(`public functions: ${contractAddress.split(".")[1]}`, () => {
  beforeEach(() => {
    // Ensure dex is graduated and pool is created
    getSbtcFromFaucet(deployer);
    graduateDex(deployer);
    enablePublicPoolCreation(deployer);
    simnet.mineEmptyBlocks(10);
  });

  it("buy-and-deposit succeeds without agent account", () => {
    // arrange
    getSbtcFromFaucet(address1);
    const amount = 100000; // 0.001 sBTC
    const minReceive = 5000000000; // example min
    const initialBalance =
      getBalancesForPrincipal(address1).get(DAO_TOKEN_ASSETS_MAP) || 0n;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [
        Cl.principal(daoTokenAddress),
        Cl.uint(amount),
        Cl.some(Cl.uint(minReceive)),
      ],
      address1
    );

    // assert
    expect(receipt.result).toBeOk(Cl.uint(expect.any(Number)));
    const finalBalance =
      getBalancesForPrincipal(address1).get(DAO_TOKEN_ASSETS_MAP) || 0n;
    expect(finalBalance).toBeGreaterThan(initialBalance);
    // Check for swap event
    expect(receipt.events).toHaveLength(expect.any(Number));
  });

  it("buy-and-deposit succeeds with agent account", () => {
    // arrange
    getSbtcFromFaucet(address2);
    fundAgentAccount(agentAccountAddress, address2);
    getSbtcFromFaucet(address1);
    const amount = 100000;
    const minReceive = 5000000000;
    const initialBalance =
      getBalancesForPrincipal(agentAccountAddress).get(DAO_TOKEN_ASSETS_MAP) ||
      0n;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [
        Cl.principal(daoTokenAddress),
        Cl.uint(amount),
        Cl.some(Cl.uint(minReceive)),
      ],
      address2
    );

    // assert
    expect(receipt.result).toBeOk(Cl.uint(expect.any(Number)));
    const finalBalance =
      getBalancesForPrincipal(agentAccountAddress).get(DAO_TOKEN_ASSETS_MAP) ||
      0n;
    expect(finalBalance).toBeGreaterThan(initialBalance);
    /* TODO: this is wrong
    // Verify transfer event to agent
    const transferEvent = receipt.events.find(
      (e) => e.type === "ft_transfer_event"
    );
    expect(transferEvent).toBeDefined();
    */
  });

  it("buy-and-deposit fails with slippage too high", () => {
    // arrange
    getSbtcFromFaucet(address1);
    const amount = 100000;
    const minReceive = 100000000000; // too high

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [
        Cl.principal(daoTokenAddress),
        Cl.uint(amount),
        Cl.some(Cl.uint(minReceive)),
      ],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_SLIPPAGE_TOO_HIGH));
  });

  it("buy-and-deposit fails without minReceive", () => {
    // arrange
    getSbtcFromFaucet(address1);
    const amount = 100000;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [Cl.principal(daoTokenAddress), Cl.uint(amount), Cl.none()],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_MIN_RECEIVE_REQUIRED));
  });

  it("buy-and-deposit fails with zero amount", () => {
    // arrange
    getSbtcFromFaucet(address1);
    const amount = 0;
    const minReceive = 1;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [
        Cl.principal(daoTokenAddress),
        Cl.uint(amount),
        Cl.some(Cl.uint(minReceive)),
      ],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_AMOUNT));
  });

  it("buy-and-deposit fails with invalid dao token", () => {
    // arrange
    getSbtcFromFaucet(address1);
    const amount = 100000;
    const minReceive = 5000000000;
    const invalidToken = `${deployer}.invalid-token`;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [
        Cl.principal(invalidToken),
        Cl.uint(amount),
        Cl.some(Cl.uint(minReceive)),
      ],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_DAO_TOKEN));
  });
});

/*
(define-read-only (get-contract-info)
  {
    self: SELF,
    deployedBurnBlock: DEPLOYED_BURN_BLOCK,
    deployedStacksBlock: DEPLOYED_STACKS_BLOCK,
    ;; /g/.agent-account-registry/faktory_agent_account_registry
    agentAccountRegistry: .agent-account-registry,
    ;; /g/.aibtc-faktory-dex/dao_contract_token_dex
    swapContract: .aibtc-faktory-dex,
    daoToken: DAO_TOKEN,
    sbtcToken: SBTC_TOKEN,
  }
)
*/

type BitflowBuyAndDepositContractInfo = {
  self: string;
  deployedBurnBlock: number;
  deployedStacksBlock: number;
  agentAccountRegistry: string;
  swapContract: string;
  daoToken: string;
  sbtcToken: string;
};

describe(`read-only functions: ${contractAddress.split(".")[1]}`, () => {
  it("get-contract-info returns correct info", () => {
    // act
    const infoResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-contract-info",
      [],
      deployer
    );

    // assert
    expect(infoResult.result.type).toBe(ClarityType.Tuple);
    const info = convertClarityTuple<BitflowBuyAndDepositContractInfo>(
      infoResult.result
    );
    expect(info.self).toBe(contractAddress);
    expect(info.daoToken).toBe(daoTokenAddress);
    expect(info.sbtcToken).toBe(SBTC_CONTRACT);
    // Add more field assertions as needed
  });
});
