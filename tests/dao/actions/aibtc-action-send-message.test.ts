import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { ErrCodeActionSendMessage } from "../../utilities/contract-error-codes";
import {
  constructDao,
  fundVoters,
  passActionProposal,
} from "../../utilities/dao-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;

const contractName = "aibtc-action-send-message";
const contractAddress = `${deployer}.${contractName}`;

const ErrCode = ErrCodeActionSendMessage;

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////
  // callback() tests
  ////////////////////////////////////
  it("callback() should respond with (ok true)", () => {
    // act
    const callback = simnet.callPublicFn(
      contractAddress,
      "callback",
      [Cl.principal(deployer), Cl.bufferFromAscii("test")],
      deployer
    );
    // assert
    expect(callback.result).toBeOk(Cl.bool(true));
  });
  ////////////////////////////////////
  // run() tests
  ////////////////////////////////////
  it("run() fails if called directly", () => {
    // act
    const message = "hello world";
    const receipt = simnet.callPublicFn(
      contractAddress,
      "run",
      [Cl.buffer(Cl.serialize(Cl.stringAscii(message)))],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
  });
  it("run() succeeds if called as a DAO action proposal", () => {
    // arrange
    const memo = "hello world";
    // setup contract names
    const tokenContractAddress = `${deployer}.aibtc-token`;
    const tokenDexContractAddress = `${deployer}.aibtc-token-dex`;
    const baseDaoContractAddress = `${deployer}.aibtc-base-dao`;
    const actionProposalsContractAddress = `${deployer}.aibtc-action-proposal-voting`;
    const bootstrapContractAddress = `${deployer}.aibtc-base-initialize-dao`;
    // fund accounts for creating and voting on proposals
    const voters = [deployer, address1, address2, address3];
    fundVoters(tokenContractAddress, tokenDexContractAddress, voters);
    // construct the DAO
    constructDao(deployer, baseDaoContractAddress, bootstrapContractAddress);
    // pass the action proposal
    passActionProposal(
      actionProposalsContractAddress,
      contractAddress,
      Cl.stringAscii(memo),
      deployer,
      deployer,
      voters,
      memo
    );
  });
});
