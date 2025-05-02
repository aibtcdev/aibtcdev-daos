import { ContractRegistry } from "./contract-registry";
import { BaseContract } from "../models/dao-base-contract";
import { TokenContract } from "../models/dao-token-contract";
import { ExtensionContract } from "../models/dao-extension-contract";
import { ActionContract } from "../models/dao-action-contract";
import { ProposalContract } from "../models/dao-proposal-contract";

export function setupDaoContractRegistry(): ContractRegistry {
  const registry = new ContractRegistry();

  // Base contracts

  const baseDao = new BaseContract("aibtc-base-dao", "DAO");
  registry.register(baseDao);

  // Extensions

  const actionProposalVoting = new ExtensionContract(
    "aibtc-action-proposal-voting",
    "ACTION_PROPOSAL_VOTING"
  );
  registry.register(actionProposalVoting);

  const daoCharter = new ExtensionContract("aibtc-dao-charter", "DAO_CHARTER");
  registry.register(daoCharter);

  const daoEpoch = new ExtensionContract("aibtc-dao-epoch", "DAO_EPOCH");
  registry.register(daoEpoch);

  const daoUsers = new ExtensionContract("aibtc-dao-users", "DAO_USERS");
  registry.register(daoUsers);

  const onchainMessaging = new ExtensionContract(
    "aibtc-onchain-messaging",
    "ONCHAIN_MESSAGING"
  );
  registry.register(onchainMessaging);

  const rewardsAccount = new ExtensionContract(
    "aibtc-rewards-account",
    "REWARDS_ACCOUNT"
  );
  registry.register(rewardsAccount);

  const tokenOwner = new ExtensionContract("aibtc-token-owner", "TOKEN_OWNER");
  registry.register(tokenOwner);

  const treasury = new ExtensionContract("aibtc-treasury", "TREASURY");
  registry.register(treasury);

  // Actions

  const sendMessage = new ActionContract(
    "aibtc-action-send-message",
    "SEND_MESSAGE"
  );
  registry.register(sendMessage);

  // Proposals

  const initializeDao = new ProposalContract(
    "aibtc-initialize-dao",
    "INITIALIZE_DAO"
  );
  registry.register(initializeDao);

  // Token contracts
  const daoToken = new TokenContract("aibtc-faktory", "DAO");
  registry.register(daoToken);

  const daoDex = new TokenContract("aibtc-faktory-dex", "DEX");
  registry.register(daoDex);

  const daoPool = new TokenContract("xyk-pool-sbtc-aibtc-v-1-1", "POOL");
  registry.register(daoPool);

  const daoPrelaunch = new TokenContract("aibtc-pre-dex", "PRELAUNCH");
}

// Create and populate the registry
export function setupFullContractRegistry(): ContractRegistry {
  const registry = new ContractRegistry();

  // Base contracts
  const baseDao = new BaseContract("aibtc-base-dao", "DAO");
  baseDao.addTraitDependency("DAO_BASE", "base_dao_trait");
  baseDao.addTraitDependency("DAO_PROPOSAL", "proposal_trait");
  baseDao.addTraitDependency("DAO_EXTENSION", "extension_trait");
  baseDao.clarityVersion = 3;
  registry.register(baseDao);

  // Just one example of each type of contract for brevity
  // Token example
  const tokenContract = new TokenContract("aibtc-faktory", "DAO");
  tokenContract.addTraitDependency("STANDARD_SIP010", "sip10_trait");
  tokenContract.addContractDependency("base_dao_contract", "BASE", "DAO");
  registry.register(tokenContract);

  // Extensions example
  const actionProposals = new ExtensionContract(
    "aibtc-action-proposals-v2",
    "ACTION_PROPOSALS"
  );
  actionProposals.addTraitDependency("DAO_EXTENSION", "extension_trait");
  actionProposals.addTraitDependency(
    "DAO_ACTION_PROPOSALS",
    "action_proposals_trait"
  );
  actionProposals.addTraitDependency("DAO_ACTION", "action_trait");
  actionProposals.addTraitDependency("DAO_TREASURY", "treasury_trait");
  actionProposals.addContractDependency("base_dao_contract", "BASE", "DAO");
  actionProposals.addContractDependency("token_contract", "TOKEN", "DAO");
  actionProposals.addContractDependency(
    "token_pre_dex_contract",
    "TOKEN",
    "PRELAUNCH"
  );
  actionProposals.addContractDependency("token_dex_contract", "TOKEN", "DEX");
  actionProposals.addContractDependency("token_pool_contract", "TOKEN", "POOL");
  actionProposals.addContractDependency(
    "treasury_contract",
    "EXTENSIONS",
    "TREASURY"
  );
  actionProposals.clarityVersion = 3;
  registry.register(actionProposals);

  // Action example
  const sendMessage = new ActionContract(
    "aibtc-action-send-message",
    "MESSAGING_SEND_MESSAGE"
  );
  sendMessage.addTraitDependency("DAO_ACTION", "action_trait");
  sendMessage.addContractDependency("base_dao_contract", "BASE", "DAO");
  sendMessage.addContractDependency(
    "messaging_contract",
    "EXTENSIONS",
    "MESSAGING"
  );
  registry.register(sendMessage);

  // Proposal example
  const bootstrapProposal = new ProposalContract(
    "aibtc-base-bootstrap-initialization-v2",
    "BOOTSTRAP_INIT"
  );
  bootstrapProposal.addTraitDependency("DAO_PROPOSAL", "dao_proposal_trait");
  bootstrapProposal.addAddressDependency("SBTC", "sbtc_contract");
  bootstrapProposal.addContractDependency("base_dao_contract", "BASE", "DAO");
  bootstrapProposal.addContractDependency("token_contract", "TOKEN", "DAO");
  // ... add other dependencies
  bootstrapProposal.addRuntimeValue("dao_manifest");
  bootstrapProposal.addRuntimeValue("dao_manifest_inscription_id");
  registry.register(bootstrapProposal);

  // You would add all your contracts here...
  // This is just a small example of the pattern

  return registry;
}
