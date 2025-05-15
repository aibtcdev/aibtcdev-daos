import { StacksNetworkName } from "@stacks/network";
import { getKnownTraits } from "./known-traits";
import { getKnownAddresses } from "./known-addresses";

/**
 * Generate a complete set of template variable replacements for a given network
 */
export function generateTemplateReplacements(
  network: StacksNetworkName,
  tokenSymbol: string = "aibtc",
  customReplacements: Record<string, string> = {}
): Record<string, string> {
  const traits = getKnownTraits(network);
  const addresses = getKnownAddresses(network);

  // Always use "aibtc" for template keys since that's what's in the template files
  const templateKeySymbol = "aibtc";

  // But use the provided tokenSymbol for the actual values
  const displaySymbol = tokenSymbol.toUpperCase();

  // Base replacements
  const replacements: Record<string, string> = {
    // Token info
    [`${templateKeySymbol}/dao_token_symbol`]: displaySymbol,
    [`dao_token_symbol`]: displaySymbol,
    [`dao_token_name`]: `${displaySymbol} DAO Token`,
    [`dao_token_decimals`]: "8",

    // Account addresses
    [`account_owner`]: addresses.DEPLOYER,
    [`account_agent`]: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",

    // SIP traits
    [`base_trait_sip010`]: traits.BASE_SIP010,

    // DAO traits with full paths for template matching
    [`.aibtc-dao-traits.extension/dao_trait_extension`]: traits.DAO_EXTENSION,
    [`.aibtc-dao-traits.action/dao_trait_action`]: traits.DAO_ACTION,
    [`.aibtc-dao-traits.proposal/dao_trait_proposal`]: traits.DAO_PROPOSAL,
    [`.aibtc-dao-traits.token-owner/dao_trait_token_owner`]:
      traits.DAO_TOKEN_OWNER,
    [`.aibtc-dao-traits.faktory-dex/dao_trait_faktory_dex`]:
      traits.DAO_TOKEN_DEX,
    [`.aibtc-base-dao-trait.aibtc-base-dao/dao_trait_base`]: traits.DAO_BASE,

    // DAO traits with simplified keys
    [`dao_trait_extension`]: traits.DAO_EXTENSION,
    [`dao_trait_action`]: traits.DAO_ACTION,
    [`dao_trait_proposal`]: traits.DAO_PROPOSAL,
    [`dao_trait_token_owner`]: traits.DAO_TOKEN_OWNER,
    [`dao_trait_faktory_dex`]: traits.DAO_TOKEN_DEX,
    [`dao_trait_faktory_token`]: traits.FAKTORY_SIP010,
    [`dao_trait_base`]: traits.DAO_BASE,
    [`dao_trait_charter`]: traits.DAO_CHARTER,
    [`dao_trait_users`]: traits.DAO_USERS,
    [`dao_trait_messaging`]: traits.DAO_MESSAGING,
    [`dao_trait_treasury`]: traits.DAO_TREASURY,
    [`dao_trait_rewards_account`]: traits.DAO_REWARDS_ACCOUNT,
    [`dao_trait_epoch`]: traits.DAO_EPOCH,
    [`dao_trait_action_proposals_voting`]: traits.DAO_ACTION_PROPOSAL_VOTING,

    // Agent traits with full paths for template matching
    [`.aibtc-agent-account-traits.aibtc-account/agent_account_trait_account`]:
      traits.AGENT_ACCOUNT,
    [`.aibtc-agent-account-traits.aibtc-faktory-dex/agent_account_trait_faktory_dex_approval`]:
      traits.AGENT_FAKTORY_DEX_APPROVAL,
    [`.aibtc-agent-account-traits.aibtc-proposals/agent_account_trait_proposals`]:
      traits.AGENT_PROPOSALS,
    [`.aibtc-agent-account-traits.faktory-buy-sell/agent_account_trait_faktory_buy_sell`]:
      traits.AGENT_FAKTORY_BUY_SELL,

    // Agent traits with simplified keys
    [`agent_account_trait_account`]: traits.AGENT_ACCOUNT,
    [`agent_account_trait_faktory_dex_approval`]:
      traits.AGENT_FAKTORY_DEX_APPROVAL,
    [`agent_account_trait_proposals`]: traits.AGENT_PROPOSALS,
    [`agent_account_trait_faktory_buy_sell`]: traits.AGENT_FAKTORY_BUY_SELL,

    // Contract references with full paths for template matching
    [`.aibtc-faktory/dao_contract_token`]: `.${tokenSymbol}-faktory`,
    [`.aibtc-faktory-dex/dao_contract_token_dex`]: `.${tokenSymbol}-faktory-dex`,
    [`.aibtc-base-dao/dao_contract_base`]: `.${tokenSymbol}-base-dao`,
    [`.aibtc-treasury/dao_contract_treasury`]: `.${tokenSymbol}-treasury`,
    [`.aibtc-dao-users/dao_contract_users`]: `.${tokenSymbol}-dao-users`,
    [`.aibtc-action-proposal-voting/dao_contract_action_proposal_voting`]: `.${tokenSymbol}-action-proposal-voting`,
    [`.aibtc-dao-charter/dao_contract_charter`]: `.${tokenSymbol}-dao-charter`,
    [`.aibtc-dao-epoch/dao_contract_epoch`]: `.${tokenSymbol}-dao-epoch`,
    [`.aibtc-onchain-messaging/dao_contract_messaging`]: `.${tokenSymbol}-onchain-messaging`,
    [`.aibtc-token-owner/dao_contract_token_owner`]: `.${tokenSymbol}-token-owner`,
    [`.aibtc-token-owner/dao_token_owner_contract`]: `.${tokenSymbol}-token-owner`,
    [`.aibtc-action-send-message/dao_action_send_message`]: `.${tokenSymbol}-action-send-message`,
    [`.aibtc-action-send-message/dao_action_send_message_contract`]: `.${tokenSymbol}-action-send-message`,
    [`.dao-run-cost/base_contract_dao_run_cost`]: `.aibtc-dao-run-cost`,
    [`.aibtc-rewards-account/dao_contract_rewards_account`]: `.${tokenSymbol}-rewards-account`,

    // Contract references with simplified keys
    [`dao_contract_token`]: `.${tokenSymbol}-faktory`,
    [`dao_contract_token_dex`]: `.${tokenSymbol}-faktory-dex`,
    [`dao_contract_base`]: `.${tokenSymbol}-base-dao`,
    [`dao_contract_treasury`]: `.${tokenSymbol}-treasury`,
    [`dao_contract_users`]: `.${tokenSymbol}-dao-users`,
    [`dao_contract_action_proposal_voting`]: `.${tokenSymbol}-action-proposal-voting`,
    [`dao_contract_charter`]: `.${tokenSymbol}-dao-charter`,
    [`dao_contract_epoch`]: `.${tokenSymbol}-dao-epoch`,
    [`dao_contract_messaging`]: `.${tokenSymbol}-onchain-messaging`,
    [`dao_contract_token_owner`]: `.${tokenSymbol}-token-owner`,
    [`dao_token_owner_contract`]: `.${tokenSymbol}-token-owner`,
    [`dao_action_send_message`]: `.${tokenSymbol}-action-send-message`,
    [`dao_action_send_message_contract`]: `.${tokenSymbol}-action-send-message`,
    [`base_contract_dao_run_cost`]: `.aibtc-dao-run-cost`,
    [`dao_contract_rewards_account`]: `.${tokenSymbol}-rewards-account`,

    // External contracts
    [`sbtc_contract`]: addresses.SBTC,
    [`sbtc_token_contract`]: addresses.SBTC,
    [`base_contract_sbtc`]: addresses.SBTC,

    // Configuration values
    [`dao_manifest`]: `The mission of the ${displaySymbol} DAO is to...`,
  };

  // Merge with custom replacements
  return {
    ...replacements,
    ...customReplacements,
  };
}

/**
 * Get a list of all known template variables
 */
export function getAllKnownTemplateVariables(): string[] {
  // Generate a complete set of replacements for devnet
  const replacements = generateTemplateReplacements("devnet");

  // Return the keys
  return Object.keys(replacements);
}
