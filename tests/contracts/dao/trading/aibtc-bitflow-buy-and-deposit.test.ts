import { Cl, ClarityType } from "@stacks/transactions";
import { beforeEach, describe, expect, it } from "vitest";
import { ErrCodeBitflowBuyAndDeposit } from "../../../../utilities/contract-error-codes";
import { setupFullContractRegistry } from "../../../../utilities/contract-registry";
import {
  convertClarityTuple,
  SBTC_CONTRACT,
  DAO_TOKEN_ASSETS_MAP,
} from "../../../../utilities/contract-helpers";
import {
  getSbtcFromFaucet,
  graduateDex,
  enablePublicPoolCreation,
} from "../../../../utilities/dao-helpers";
import { getBalancesForPrincipal } from "../../../../utilities/asset-helpers";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!; // owner
const address1 = accounts.get("wallet_1")!; // agent

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
    enablePublicPoolCreation(deployer);
    graduateDex(deployer);
    simnet.mineEmptyBlocks(10);
  });

  it("buy-and-deposit succeeds without agent account", () => {
    // arrange
    getSbtcFromFaucet(address1);
    const amount = 100000; // 0.001 sBTC
    const minReceive = 5000000000; // example min 50 DAO tokens
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

    if (receipt.result.type !== ClarityType.ResponseOk) {
      throw new Error(
        `buy-and-deposit failed: ${JSON.stringify(receipt.result)}`
      );
    }

    // extract value from receipt
    const { value } = receipt.result;

    if (value.type !== ClarityType.UInt) {
      throw new Error(
        `buy-and-deposit response malformed, unexpected value: ${JSON.stringify(
          value
        )}`
      );
    }

    // assert
    const finalBalance =
      getBalancesForPrincipal(address1).get(DAO_TOKEN_ASSETS_MAP) || 0n;
    expect(finalBalance).toBeGreaterThan(initialBalance);
    expect(finalBalance).toEqual(value.value);
  });

  it("buy-and-deposit succeeds with agent account", () => {
    // arrange
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
      deployer
    );

    if (receipt.result.type !== ClarityType.ResponseOk) {
      throw new Error(
        `buy-and-deposit failed: ${JSON.stringify(receipt.result)}`
      );
    }

    // extract value from receipt
    const { value } = receipt.result;

    if (value.type !== ClarityType.UInt) {
      throw new Error(
        `buy-and-deposit response malformed, unexpected value: ${JSON.stringify(
          value
        )}`
      );
    }

    // assert
    const finalBalance =
      getBalancesForPrincipal(agentAccountAddress).get(DAO_TOKEN_ASSETS_MAP) ||
      0n;
    expect(finalBalance).toBeGreaterThan(initialBalance);
    expect(finalBalance).toEqual(value.value);
  });

  it("buy-and-deposit fails with slippage too high", () => {
    // arrange
    getSbtcFromFaucet(address1);
    const amount = 100000;
    const minReceive = 100000000000000000n; // 1B token w/ 8 decimals

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [
        Cl.principal(daoTokenAddress),
        Cl.uint(amount),
        Cl.some(Cl.uint(minReceive)),
      ],
      deployer
    );

    // assert
    // error u1020 from xyk-core-v-1-2 ERR_MINIMUM_Y_AMOUNT
    expect(receipt.result).toBeErr(Cl.uint(1020));
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
    const invalidToken = `${deployer}.unknown-token`;

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
