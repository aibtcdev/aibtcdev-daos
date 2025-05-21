import { StacksNetworkName } from "@stacks/network";
import { getKnownTraits } from "./known-traits";
import { getKnownAddresses } from "./known-addresses";

/**
 * Generate a complete set of template variable replacements for a given network
 *
 * Note: Template variables in contracts are formatted as: ;; /g/variable/replacement_key
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

  const symbol = tokenSymbol;

  const baseAndExternalReplacements: Record<string, string> = {
    // Base Traits
    [`SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait/base_trait_sip010`]: `${traits.BASE_SIP010}`,
    [`base_trait_sip010`]: `${traits.BASE_SIP010}`,
    // DAO run cost
    [`.dao-run-cost/base_contract_dao_run_cost`]: `'${addresses.AIBTC_RUN_COST}`,
    // External contracts
    [`sbtc_contract`]: addresses.SBTC,
    [`sbtc_token_contract`]: addresses.SBTC,
    [`base_contract_sbtc`]: addresses.SBTC,
    [`external_bitflow_core`]: addresses.BITFLOW_CORE,
  };

  const daoReplacements: Record<string, string> = {
    // DAO Traits
    [`.aibtc-dao-traits.extension/dao_trait_extension`]: `'${traits.DAO_EXTENSION}`,
    [`dao_trait_extension`]: `'${traits.DAO_EXTENSION}`,
    [`.aibtc-dao-traits.action/dao_trait_action`]: `'${traits.DAO_ACTION}`,
    [`dao_trait_action`]: `'${traits.DAO_ACTION}`,
    [`.aibtc-dao-traits.proposal/dao_trait_proposal`]: `'${traits.DAO_PROPOSAL}`,
    [`dao_trait_proposal`]: `'${traits.DAO_PROPOSAL}`,
    [`.aibtc-dao-traits.token-owner/dao_trait_token_owner`]: `'${traits.DAO_TOKEN_OWNER}`,
    [`dao_trait_token_owner`]: `'${traits.DAO_TOKEN_OWNER}`,
    [`.aibtc-dao-traits.faktory-dex/dao_trait_faktory_dex`]: `'${traits.DAO_TOKEN_DEX}`,
    [`dao_trait_faktory_dex`]: `'${traits.DAO_TOKEN_DEX}`,
    [`.aibtc-base-dao-trait.aibtc-base-dao/dao_trait_base`]: `'${traits.DAO_BASE}`,
    [`dao_trait_base`]: `'${traits.DAO_BASE}`,
    // DAO traits with simplified keys
    [`dao_trait_faktory_token`]: `${traits.FAKTORY_SIP010}`,
    [`dao_trait_charter`]: `'${traits.DAO_CHARTER}`,
    [`dao_trait_users`]: `'${traits.DAO_USERS}`,
    [`dao_trait_messaging`]: `'${traits.DAO_MESSAGING}`,
    [`dao_trait_treasury`]: `'${traits.DAO_TREASURY}`,
    [`dao_trait_rewards_account`]: `'${traits.DAO_REWARDS_ACCOUNT}`,
    [`dao_trait_epoch`]: `'${traits.DAO_EPOCH}`,
    [`dao_trait_action_proposal_voting`]: `'${traits.DAO_ACTION_PROPOSAL_VOTING}`,
    [`.aibtc-dao-traits.action-proposal-voting/dao_trait_action_proposal_voting`]: `'${traits.DAO_ACTION_PROPOSAL_VOTING}`,
    // DAO Token Info
    [`${templateKeySymbol}/dao_token_symbol`]: symbol,
    [`dao_token_symbol`]: symbol,
    [`dao_token_name`]: symbol,
    [`dao_token_decimals`]: "8",
    [`dao_contract_token_prelaunch`]: `.${symbol}-pre-faktory`,
    [`dao_contract_token_pool`]: `.xyk-pool-sbtc-${symbol}-v-1-1`,
    // DAO contract references with full paths for template matching
    [`.aibtc-faktory/dao_contract_token`]: `.${symbol}-faktory`,
    [`.aibtc-faktory-dex/dao_contract_token_dex`]: `.${symbol}-faktory-dex`,
    [`.aibtc-base-dao/dao_contract_base`]: `.${symbol}-base-dao`,
    [`.aibtc-treasury/dao_contract_treasury`]: `.${symbol}-treasury`,
    [`.aibtc-dao-users/dao_contract_users`]: `.${symbol}-dao-users`,
    [`.aibtc-action-proposal-voting/dao_contract_action_proposal_voting`]: `.${symbol}-action-proposal-voting`,
    [`.aibtc-dao-charter/dao_contract_charter`]: `.${symbol}-dao-charter`,
    [`.aibtc-dao-epoch/dao_contract_epoch`]: `.${symbol}-dao-epoch`,
    [`.aibtc-onchain-messaging/dao_contract_messaging`]: `.${symbol}-onchain-messaging`,
    [`.aibtc-token-owner/dao_contract_token_owner`]: `.${symbol}-token-owner`,
    [`.aibtc-token-owner/dao_token_owner_contract`]: `.${symbol}-token-owner`,
    [`.aibtc-action-send-message/dao_action_send_message`]: `.${symbol}-action-send-message`,
    [`.aibtc-action-send-message/dao_action_send_message_contract`]: `.${symbol}-action-send-message`,
    [`.aibtc-rewards-account/dao_contract_rewards_account`]: `.${symbol}-rewards-account`,
    // DAO contract references with simplified keys
    [`dao_contract_token`]: `.${symbol}-faktory`,
    [`dao_contract_token_dex`]: `.${symbol}-faktory-dex`,
    [`dao_contract_base`]: `.${symbol}-base-dao`,
    [`dao_contract_treasury`]: `.${symbol}-treasury`,
    [`dao_contract_users`]: `.${symbol}-dao-users`,
    [`dao_contract_action_proposal_voting`]: `.${symbol}-action-proposal-voting`,
    [`dao_contract_charter`]: `.${symbol}-dao-charter`,
    [`dao_contract_epoch`]: `.${symbol}-dao-epoch`,
    [`dao_contract_messaging`]: `.${symbol}-onchain-messaging`,
    [`dao_contract_token_owner`]: `.${symbol}-token-owner`,
    [`dao_token_owner_contract`]: `.${symbol}-token-owner`,
    [`dao_action_send_message`]: `.${symbol}-action-send-message`,
    [`dao_action_send_message_contract`]: `.${symbol}-action-send-message`,
    [`base_contract_dao_run_cost`]: `'${addresses.AIBTC_RUN_COST}`,
    [`dao_contract_rewards_account`]: `.${symbol}-rewards-account`,
    // DAO Manifest
    [`dao_manifest`]: `The mission of the ${symbol} is to...`,
  };

  const agentAccountReplacements: Record<string, string> = {
    // Agent account traits with full paths for template matching
    [`.aibtc-agent-account-traits.aibtc-account/agent_account_trait_account`]: `'${traits.AGENT_ACCOUNT}`,
    [`.aibtc-agent-account-traits.faktory-dex-approval/agent_account_trait_faktory_dex_approval`]: `'${traits.AGENT_FAKTORY_DEX_APPROVAL}`,
    [`.aibtc-agent-account-traits.aibtc-proposals/agent_account_trait_proposals`]: `'${traits.AGENT_ACCOUNT_PROPOSALS}`,
    [`.aibtc-agent-account-traits.faktory-buy-sell/agent_account_trait_faktory_buy_sell`]: `'${traits.AGENT_FAKTORY_BUY_SELL}`,
    // Agent traits with simplified keys
    [`agent_account_trait_account`]: `'${traits.AGENT_ACCOUNT}`,
    [`agent_account_trait_faktory_dex_approval`]: `'${traits.AGENT_FAKTORY_DEX_APPROVAL}`,
    [`agent_account_trait_proposals`]: `'${traits.AGENT_ACCOUNT_PROPOSALS}`,
    [`agent_account_trait_faktory_buy_sell`]: `'${traits.AGENT_FAKTORY_BUY_SELL}`,
    // Agent account addresses
    [`ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/account_owner`]: `${addresses.DEPLOYER}`,
    [`account_owner`]: `${addresses.DEPLOYER}`,
    [`ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG/account_agent`]:
      "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
    [`account_agent`]: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
    // dao token and dex contracts
    [`dao_contract_token`]: `.${symbol}-faktory`,
    [`.aibtc-faktory/dao_contract_token`]: `.${symbol}-faktory`,
    [`dao_contract_token_dex`]: `.${symbol}-faktory-dex`,
    [`.aibtc-faktory-dex/dao_contract_token_dex`]: `.${symbol}-faktory-dex`,
  };

  // Merge with custom replacements
  return {
    ...baseAndExternalReplacements,
    ...daoReplacements,
    ...agentAccountReplacements,
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
