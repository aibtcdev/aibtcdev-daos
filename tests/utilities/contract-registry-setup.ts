import { ContractRegistry } from "./ContractRegistry";
import { BaseContract } from "./models/BaseContract";
import { TokenContract } from "./models/TokenContract";
import { ExtensionContract } from "./models/ExtensionContract";
import { ActionContract } from "./models/ActionContract";
import { ProposalContract } from "./models/ProposalContract";

// Create and populate the registry
export function setupContractRegistry(): ContractRegistry {
  const registry = new ContractRegistry();

  // Base contracts
  const baseDao = new BaseContract("aibtc-base-dao");
  baseDao.addTraitDependency("DAO_BASE", "base_dao_trait");
  baseDao.addTraitDependency("DAO_PROPOSAL", "proposal_trait");
  baseDao.addTraitDependency("DAO_EXTENSION", "extension_trait");
  baseDao.clarityVersion = 3;
  registry.register(baseDao);

  // Just one example of each type of contract for brevity
  // Token example
  const tokenContract = new TokenContract("aibtc-dao-v2", "DAO");
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
