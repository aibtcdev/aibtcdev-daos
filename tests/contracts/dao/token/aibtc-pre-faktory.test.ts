import { Cl, ClarityType, cvToValue } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { setupDaoContractRegistry } from "../../../../utilities/contract-registry";
import {
  completePrelaunch,
  getSbtcFromFaucet,
} from "../../../../utilities/dao-helpers";
import {
  FaktoryContractStatus,
  FaktoryUserExpectedShare,
  FaktoryUserInfo,
} from "../../../../utilities/dao-types";
import {
  convertClarityTuple,
  decodeClarityValues,
} from "../../../../utilities/contract-helpers";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;
const address4 = accounts.get("wallet_4")!;
const address5 = accounts.get("wallet_5")!;
const address6 = accounts.get("wallet_6")!;

const satsAmount = 1000000; // 1 million satoshis

// setup contract info for tests
const registry = setupDaoContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "PRELAUNCH"
);
const contractName = contractAddress.split(".")[1];
const tokenContractAddress = registry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "DAO"
);

// Error codes from contract
const ERR_NO_SEATS_LEFT = 301;
const ERR_NOT_SEAT_OWNER = 302;
const ERR_NOTHING_TO_CLAIM = 304;
const ERR_NOT_AUTHORIZED = 305;
const ERR_WRONG_TOKEN = 307;
const ERR_CONTRACT_INSUFFICIENT_FUNDS = 311;
const ERR_INVALID_SEAT_COUNT = 313;
const ERR_DISTRIBUTION_ALREADY_SET = 320;
const ERR_DISTRIBUTION_NOT_INITIALIZED = 321;
const ERR_NO_FEES_TO_DISTRIBUTE = 323;
const ERR_COOLDOWN_ACTIVE = 324;
const ERR_TOTAL_SEATS_ZERO = 325;

describe.skip(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // buy-up-to() tests
  ////////////////////////////////////////
  it("buy-up-to() succeeds with valid parameters", () => {
    // arrange
    getSbtcFromFaucet(address1);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-up-to",
      [Cl.uint(2)],
      address1
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // Check that seats were assigned
    const userInfoResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-info",
      [Cl.principal(address1)],
      deployer
    ).result;

    if (userInfoResult.type !== ClarityType.ResponseOk) {
      throw new Error("get-user-info() failed when it shouldn't");
    }

    const userInfo = convertClarityTuple<FaktoryUserInfo>(userInfoResult.value);
    expect(userInfo["seats-owned"]).toStrictEqual(2n);
  });

  it("buy-up-to() fails with invalid seat count (0)", () => {
    // arrange
    getSbtcFromFaucet(address2);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-up-to",
      [Cl.uint(0)],
      address2
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_INVALID_SEAT_COUNT));
  });

  it("buy-up-to() updates total users and seats taken", () => {
    // arrange
    getSbtcFromFaucet(address3);

    // Get initial values
    const initialStatusResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-contract-status",
      [],
      deployer
    ).result;

    if (initialStatusResult.type !== ClarityType.ResponseOk) {
      throw new Error("get-contract-status() failed when it shouldn't");
    }

    const initialStatus = convertClarityTuple<FaktoryContractStatus>(
      initialStatusResult.value
    );
    const initialUsers = initialStatus["total-users"];
    const initialSeats = initialStatus["total-seats-taken"];

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-up-to",
      [Cl.uint(3)],
      address3
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // Check that total users and seats were updated
    const newStatusResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-contract-status",
      [],
      deployer
    ).result;

    if (newStatusResult.type !== ClarityType.ResponseOk) {
      throw new Error("get-contract-status() failed when it shouldn't");
    }

    const newStatus = convertClarityTuple<FaktoryContractStatus>(
      newStatusResult.value
    );
    expect(newStatus["total-users"]).toStrictEqual(initialUsers + 1n);
    expect(newStatus["total-seats-taken"]).toStrictEqual(initialSeats + 3n);
  });

  ////////////////////////////////////////
  // refund() tests
  ////////////////////////////////////////
  it("refund() succeeds for seat owner before distribution starts", () => {
    // arrange
    getSbtcFromFaucet(address4);

    // First buy some seats
    simnet.callPublicFn(contractAddress, "buy-up-to", [Cl.uint(2)], address4);

    // Verify seats were purchased
    const userInfoBeforeResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-info",
      [Cl.principal(address4)],
      deployer
    ).result;

    if (userInfoBeforeResult.type !== ClarityType.ResponseOk) {
      throw new Error("get-user-info() failed when it shouldn't");
    }
    const userInfoBefore = convertClarityTuple<FaktoryUserInfo>(
      userInfoBeforeResult.value
    );
    expect(userInfoBefore["seats-owned"]).toStrictEqual(2n);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "refund",
      [],
      address4
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // Check that seats were removed
    const userInfoAfterResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-info",
      [Cl.principal(address4)],
      deployer
    ).result;
    if (userInfoAfterResult.type !== ClarityType.ResponseOk) {
      throw new Error("get-user-info() failed when it shouldn't");
    }
    const userInfoAfter = convertClarityTuple<FaktoryUserInfo>(
      userInfoAfterResult.value
    );
    expect(userInfoAfter["seats-owned"]).toStrictEqual(0n);
  });

  it("refund() fails for non-seat owner", () => {
    // arrange
    // Use an address that hasn't bought seats
    getSbtcFromFaucet(address5);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "refund",
      [],
      address5
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_NOT_SEAT_OWNER));
  });

  ////////////////////////////////////////
  // claim() tests
  ////////////////////////////////////////
  it("claim() fails if distribution not initialized", () => {
    // arrange
    getSbtcFromFaucet(address6);

    // Buy seats
    simnet.callPublicFn(contractAddress, "buy-up-to", [Cl.uint(2)], address6);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "claim",
      [Cl.principal(tokenContractAddress)],
      address6
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_DISTRIBUTION_NOT_INITIALIZED));
  });

  it("claim() succeeds after distribution is initialized", () => {
    // arrange
    completePrelaunch(deployer);

    // Mine some blocks to reach first vesting period
    simnet.mineEmptyBurnBlocks(100);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "claim",
      [Cl.principal(tokenContractAddress)],
      address1
    );

    // assert
    expect(receipt.result.type).toBe(ClarityType.ResponseOk);
    if (receipt.result.type !== ClarityType.ResponseOk) {
      throw new Error("claim() did not return an ok response");
    }
    const claimedAmount = cvToValue(receipt.result).value;
    expect(BigInt(claimedAmount)).toBeGreaterThan(0n);

    // Check that claimed amount was updated
    const userInfoResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-info",
      [Cl.principal(address1)],
      deployer
    ).result;

    expect(userInfoResult.type).toBe(ClarityType.ResponseOk);
    if (userInfoResult.type !== ClarityType.ResponseOk) {
      throw new Error("get-user-info() did not return an ok response");
    }
    expect(userInfoResult.value.type).toBe(ClarityType.Tuple);
    if (userInfoResult.value.type !== ClarityType.Tuple) {
      throw new Error(
        "get-user-info() did not return a tuple inside the ok response"
      );
    }
    const userInfoData = convertClarityTuple<FaktoryUserInfo>(
      userInfoResult.value
    );
    expect(userInfoData["amount-claimed"]).toBeGreaterThan(0n);
  });

  ////////////////////////////////////////
  // claim-on-behalf() tests
  ////////////////////////////////////////
  it("claim-on-behalf() succeeds for valid holder", () => {
    // arrange
    completePrelaunch(deployer);

    // Mine some blocks to reach next vesting period
    simnet.mineEmptyBurnBlocks(150);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "claim-on-behalf",
      [Cl.principal(tokenContractAddress), Cl.principal(address2)],
      address1 // address1 claims for address2
    );

    // assert
    expect(receipt.result.type).toBe(ClarityType.ResponseOk);
    const claimedAmount = cvToValue(receipt.result).value;
    expect(BigInt(claimedAmount)).toBeGreaterThan(0n);

    // Check that claimed amount was updated for address2
    const userInfoResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-info",
      [Cl.principal(address2)],
      deployer
    ).result;

    expect(userInfoResult.type).toBe(ClarityType.ResponseOk);
    if (userInfoResult.type !== ClarityType.ResponseOk) {
      throw new Error("get-user-info() did not return an ok response");
    }
    expect(userInfoResult.value.type).toBe(ClarityType.Tuple);
    if (userInfoResult.value.type !== ClarityType.Tuple) {
      throw new Error(
        "get-user-info() did not return a tuple inside the ok response"
      );
    }
    const userInfoData = convertClarityTuple<FaktoryUserInfo>(
      userInfoResult.value
    );
    expect(BigInt(userInfoData["amount-claimed"])).toBeGreaterThan(0n);
  });

  ////////////////////////////////////////
  // trigger-fee-airdrop() tests
  ////////////////////////////////////////
  it("trigger-fee-airdrop() fails with no fees to distribute", () => {
    // arrange
    completePrelaunch(deployer);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "trigger-fee-airdrop",
      [],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_NO_FEES_TO_DISTRIBUTE));
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // get-contract-status() tests
  ////////////////////////////////////////
  it("get-contract-status() returns valid data", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-contract-status",
      [],
      deployer
    ).result;

    // verify we got an ok result
    if (result.type !== ClarityType.ResponseOk) {
      throw new Error("get-contract-status() failed when it shouldn't");
    }

    // verify we got a tuple in ok result
    if (result.value.type !== ClarityType.Tuple) {
      throw new Error("get-contract-status() did not return a tuple");
    }

    const status = convertClarityTuple<FaktoryContractStatus>(result.value);

    // Verify the structure matches what we expect
    expect(status).toHaveProperty("is-distribution-period");
    expect(status).toHaveProperty("total-users");
    expect(status).toHaveProperty("total-seats-taken");
    expect(status).toHaveProperty("deployment-height");
    expect(status).toHaveProperty("distribution-height");
    expect(status).toHaveProperty("accelerated-vesting");
    expect(status).toHaveProperty("market-open");
    expect(status).toHaveProperty("governance-active");
    expect(status).toHaveProperty("seat-holders");
  });

  ////////////////////////////////////////
  // get-user-info() tests
  ////////////////////////////////////////
  it("get-user-info() returns valid data for seat owner", () => {
    // arrange
    // Ensure address1 has seats
    getSbtcFromFaucet(address1);
    simnet.callPublicFn(contractAddress, "buy-up-to", [Cl.uint(1)], address1);

    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-info",
      [Cl.principal(address1)],
      deployer
    ).result;

    // verify we got an ok result
    if (result.type !== ClarityType.ResponseOk) {
      throw new Error("get-user-info() failed when it shouldn't");
    }

    const userInfo = convertClarityTuple<FaktoryUserInfo>(result.value);

    // Verify the structure matches what we expect
    expect(userInfo["seats-owned"]).toEqual(1n);
    expect(userInfo["amount-claimed"]).toEqual(0n);
    expect(userInfo["claimable-amount"]).toEqual(0n);
  });

  ////////////////////////////////////////
  // get-remaining-seats() tests
  ////////////////////////////////////////
  it("get-remaining-seats() returns valid data", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-remaining-seats",
      [],
      deployer
    ).result;

    // verify we got an ok result
    if (result.type !== ClarityType.ResponseOk) {
      throw new Error("get-remaining-seats() failed when it shouldn't");
    }

    const data = convertClarityTuple<{ "remaining-seats": bigint }>(
      result.value
    );

    // Verify the structure matches what we expect
    expect(data).toHaveProperty("remaining-seats");
  });

  ////////////////////////////////////////
  // get-seats-owned() tests
  ////////////////////////////////////////
  it("get-seats-owned() returns valid data", () => {
    // arrange
    // Ensure address1 has seats
    getSbtcFromFaucet(address1);
    simnet.callPublicFn(contractAddress, "buy-up-to", [Cl.uint(1)], address1);

    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-seats-owned",
      [Cl.principal(address1)],
      deployer
    ).result;

    // verify we got an ok result
    if (result.type !== ClarityType.ResponseOk) {
      throw new Error("get-seats-owned() failed when it shouldn't");
    }

    const data = convertClarityTuple<{ "seats-owned": bigint }>(result.value);

    // Verify the structure matches what we expect
    expect(data["seats-owned"]).toEqual(1n);
  });

  ////////////////////////////////////////
  // get-claimed-amount() tests
  ////////////////////////////////////////
  it("get-claimed-amount() returns valid data", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-claimed-amount",
      [Cl.principal(address1)],
      deployer
    ).result;

    // verify we got an ok result
    if (result.type !== ClarityType.ResponseOk) {
      throw new Error("get-claimed-amount() failed when it shouldn't");
    }

    const data = convertClarityTuple<{ "claimed-amount": bigint }>(
      result.value
    );

    // Verify the structure matches what we expect
    expect(data["claimed-amount"]).toBeDefined();
  });

  ////////////////////////////////////////
  // get-vesting-schedule() tests
  ////////////////////////////////////////
  it("get-vesting-schedule() returns valid data", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-vesting-schedule",
      [],
      deployer
    ).result;

    // verify we got an ok result
    if (result.type !== ClarityType.ResponseOk) {
      throw new Error("get-vesting-schedule() failed when it shouldn't");
    }

    const data = decodeClarityValues(result.value);
    const vestingSchedule = data["vesting-schedule"];

    // Verify the vesting-schedule exists and is a list
    expect(vestingSchedule).toBeDefined();
    expect(Array.isArray(vestingSchedule)).toBe(true);
    expect(vestingSchedule.length).toBeGreaterThan(0);

    // Check the structure of the first entry
    const firstEntry = vestingSchedule[0];
    expect(firstEntry).toHaveProperty("height");
    expect(firstEntry).toHaveProperty("percent");
    expect(firstEntry).toHaveProperty("id");
  });

  ////////////////////////////////////////
  // get-seat-holders() tests
  ////////////////////////////////////////
  it("get-seat-holders() returns valid data", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-seat-holders",
      [],
      deployer
    ).result;

    // verify we got an ok result
    if (result.type !== ClarityType.ResponseOk) {
      throw new Error("get-seat-holders() failed when it shouldn't");
    }

    const data = convertClarityTuple<{
      "seat-holders": { owner: string; seats: bigint }[];
    }>(result.value);

    // Verify the structure matches what we expect
    expect(data).toHaveProperty("seat-holders");
    expect(Array.isArray(data["seat-holders"])).toBe(true);
  });

  ////////////////////////////////////////
  // is-market-open() tests
  ////////////////////////////////////////
  it("is-market-open() returns valid data", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "is-market-open",
      [],
      deployer
    ).result;

    // verify we got an ok result
    if (result.type !== ClarityType.ResponseOk) {
      throw new Error("is-market-open() failed when it shouldn't");
    }

    // assert
    expect(typeof cvToValue(result.value)).toBe("boolean");
  });

  ////////////////////////////////////////
  // is-governance-active() tests
  ////////////////////////////////////////
  it("is-governance-active() returns valid data", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "is-governance-active",
      [],
      deployer
    ).result;

    // verify we got an ok result
    if (result.type !== ClarityType.ResponseOk) {
      throw new Error("is-governance-active() failed when it shouldn't");
    }

    // assert
    expect(typeof cvToValue(result.value)).toBe("boolean");
  });

  ////////////////////////////////////////
  // get-fee-distribution-info() tests
  ////////////////////////////////////////
  it("get-fee-distribution-info() returns valid data", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-fee-distribution-info",
      [],
      deployer
    ).result;

    // verify we got an ok result
    if (result.type !== ClarityType.ResponseOk) {
      throw new Error("get-fee-distribution-info() failed when it shouldn't");
    }

    const data = convertClarityTuple(result.value);

    // Verify the structure matches what we expect
    expect(data).toHaveProperty("accumulated-fees");
    expect(data).toHaveProperty("last-airdrop-height");
    expect(data).toHaveProperty("current-height");
    expect(data).toHaveProperty("cooldown-period");
    expect(data).toHaveProperty("final-airdrop-mode");
    expect(data).toHaveProperty("can-trigger-now");
  });

  ////////////////////////////////////////
  // get-all-seat-holders() tests
  ////////////////////////////////////////
  it("get-all-seat-holders() returns valid data", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-all-seat-holders",
      [],
      deployer
    ).result;

    // verify we got an ok result
    if (result.type !== ClarityType.ResponseOk) {
      throw new Error("get-all-seat-holders() failed when it shouldn't");
    }

    const data = cvToValue(result.value);

    // Verify the result is an array
    expect(Array.isArray(data)).toBe(true);
  });

  ////////////////////////////////////////
  // get-user-expected-share() tests
  ////////////////////////////////////////
  it("get-user-expected-share() returns valid data", () => {
    // arrange
    getSbtcFromFaucet(address1);
    simnet.callPublicFn(contractAddress, "buy-up-to", [Cl.uint(1)], address1);

    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-expected-share",
      [Cl.principal(address1)],
      deployer
    ).result;

    // verify we got an ok result
    if (result.type !== ClarityType.ResponseOk) {
      throw new Error("get-user-expected-share() failed when it shouldn't");
    }

    const data = convertClarityTuple<FaktoryUserExpectedShare>(result.value);

    // Verify the structure matches what we expect
    expect(data.user).toEqual(address1);
    expect(data).toHaveProperty("user-seats");
    expect(data).toHaveProperty("total-seats");
    expect(data).toHaveProperty("total-accumulated-fees");
    expect(data).toHaveProperty("expected-share");
  });
});
