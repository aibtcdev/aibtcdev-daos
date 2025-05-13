import { describe, it, expect } from "vitest";
import {
  processContractTemplate,
  createReplacementsMap,
} from "../../utilities/template-processor";
import {
  initializeDaoTemplate,
  tokenOwnerTemplate,
} from "./test-contract-templates";
import { dbgLog } from "../../utilities/debug-logging";

describe("Template Processor", () => {
  it("should process template and replace values", () => {
    const template = `
;; This is a test template
;; /g/TEST_ADDRESS/account_owner
(define-constant ACCOUNT_OWNER 'TEST_ADDRESS) ;; owner (user/creator of account, full access)
;; /g/TEST_ADDRESS/account_agent
(define-constant ACCOUNT_AGENT 'TEST_ADDRESS) ;; agent (can only take approved actions)

;; regular line that should remain unchanged
(define-constant UNCHANGED_VALUE 'some-value)
`;

    const replacements = createReplacementsMap({
      "TEST_ADDRESS/account_owner": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
      "TEST_ADDRESS/account_agent": "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
    });

    const processed = processContractTemplate(template, replacements);

    // The template comments should be stripped out
    expect(processed).not.toContain(";; /g/TEST_ADDRESS/account_owner");
    expect(processed).not.toContain(";; /g/TEST_ADDRESS/account_agent");

    // The values should be replaced
    expect(processed).toContain(
      "(define-constant ACCOUNT_OWNER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)"
    );
    expect(processed).toContain(
      "(define-constant ACCOUNT_AGENT 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG)"
    );

    // Regular lines should remain unchanged
    expect(processed).toContain(
      "(define-constant UNCHANGED_VALUE 'some-value)"
    );
  });

  it("should handle templates with no replacements", () => {
    const template = `
;; This is a test template with no replacements
(define-constant UNCHANGED_VALUE 'some-value)
`;

    const replacements = createReplacementsMap({});
    const processed = processContractTemplate(template, replacements);

    // The content should remain unchanged
    expect(processed).toBe(template);
  });

  it("should handle templates with unknown replacement keys", () => {
    const template = `
;; This is a test template
;; /g/UNKNOWN_KEY/unknown_value
(define-constant SOME_CONSTANT 'UNKNOWN_KEY)
`;

    const replacements = createReplacementsMap({
      "DIFFERENT_KEY/different_value": "replacement",
    });

    const processed = processContractTemplate(template, replacements);

    // The unknown key comment should remain
    expect(processed).toContain(";; /g/UNKNOWN_KEY/unknown_value");

    // The value should not be replaced
    expect(processed).toContain("(define-constant SOME_CONSTANT 'UNKNOWN_KEY)");
  });

  it("should process agent account contract template", () => {
    // Create a simplified agent account template for testing
    const testAgentTemplate = `
;; title: aibtc-agent-account
;; version: 1.0.0
;; summary: A special account contract between a user and an agent for managing assets and DAO interactions.

;; owner and agent addresses
;; /g/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/account_owner
(define-constant ACCOUNT_OWNER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM) ;; owner (user/creator of account, full access)
;; /g/ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG/account_agent
(define-constant ACCOUNT_AGENT 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG) ;; agent (can only take approved actions)

;; pre-approved contracts
;; /g/STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/sbtc_contract
(define-constant SBTC_TOKEN 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token) ;; sBTC token
;; /g/.aibtc-faktory/dao_contract_token
(define-constant DAO_TOKEN .aibtc-faktory) ;; DAO token
;; /g/.aibtc-faktory-dex/dao_contract_token_dex
(define-constant DAO_TOKEN_DEX .aibtc-faktory-dex) ;; DAO token DEX
`;

    const replacements = createReplacementsMap({
      "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/account_owner":
        "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
      "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG/account_agent":
        "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
      ".aibtc-faktory/dao_contract_token": ".test-token-contract",
      ".aibtc-faktory-dex/dao_contract_token_dex": ".test-dex-contract",
      "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/sbtc_contract":
        "ST000000000000000000002AMW42H.sbtc-token",
    });

    const processed = processContractTemplate(testAgentTemplate, replacements);

    // Check that the replacements were made
    expect(processed).toContain(
      "(define-constant ACCOUNT_OWNER 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP)"
    );
    expect(processed).toContain(
      "(define-constant ACCOUNT_AGENT 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)"
    );
    expect(processed).toContain(
      "(define-constant DAO_TOKEN .test-token-contract)"
    );
    expect(processed).toContain(
      "(define-constant DAO_TOKEN_DEX .test-dex-contract)"
    );
    expect(processed).toContain(
      "(define-constant SBTC_TOKEN 'ST000000000000000000002AMW42H.sbtc-token)"
    );
  });

  it("should process DAO initialize proposal template", () => {
    const replacements = createReplacementsMap({
      "dao mission goes here/dao_manifest":
        "The mission of this DAO is to test template processing",
      ".aibtc-faktory/dao_contract_token": ".test-token-contract",
      ".aibtc-base-dao/dao_contract_base": ".test-base-dao",
      ".aibtc-action-proposal-voting/dao_contract_action_proposal_voting":
        ".test-proposal-voting",
      ".aibtc-dao-charter/dao_contract_charter": ".test-dao-charter",
      ".aibtc-dao-epoch/dao_contract_epoch": ".test-dao-epoch",
      ".aibtc-dao-users/dao_contract_users": ".test-dao-users",
      ".aibtc-onchain-messaging/dao_contract_messaging": ".test-messaging",
      ".aibtc-token-owner/dao_token_owner_contract": ".test-token-owner",
      ".aibtc-treasury/dao_contract_treasury": ".test-treasury",
      ".aibtc-action-send-message/dao_action_send_message_contract":
        ".test-send-message",
      "aibtc/dao_token_symbol": "TEST",
    });

    const processed = processContractTemplate(
      initializeDaoTemplate,
      replacements
    );

    // Check that the replacements were made
    expect(processed).toContain(
      '(define-constant CFG_DAO_MANIFEST_TEXT "The mission of this DAO is to test template processing")'
    );
    expect(processed).toContain(
      "(define-constant CFG_DAO_TOKEN .test-token-contract)"
    );
    expect(processed).toContain(
      "(try! (contract-call? .test-base-dao set-extensions"
    );
    expect(processed).toContain(
      "{extension: .test-proposal-voting, enabled: true}"
    );
    expect(processed).toContain(
      "{extension: .test-dao-charter, enabled: true}"
    );
    expect(processed).toContain('notification: "TEST-base-dao/execute"');
  });

  it("should process token owner template", () => {
    const replacements = createReplacementsMap({
      ".aibtc-dao-traits.extension/dao_trait_extension":
        ".test-traits.extension",
      ".aibtc-dao-traits.token-owner/dao_token_owner_trait":
        ".test-traits.token-owner",
      ".aibtc-faktory/dao_contract_token": ".test-token-contract",
      ".aibtc-base-dao/dao_contract_base": ".test-base-dao",
      "aibtc/dao_token_symbol": "TEST",
    });

    const processed = processContractTemplate(tokenOwnerTemplate, replacements);

    // Check that the replacements were made
    expect(processed).toContain("(impl-trait .test-traits.extension)");
    expect(processed).toContain("(impl-trait .test-traits.token-owner)");
    expect(processed).toContain(
      "(try! (as-contract (contract-call? .test-token-contract set-token-uri value)))"
    );
    expect(processed).toContain(
      "(try! (as-contract (contract-call? .test-token-contract set-contract-owner new-owner)))"
    );
    expect(processed).toContain(
      'notification: "TEST-token-owner/set-token-uri"'
    );
    expect(processed).toContain(
      "(ok (asserts! (or (is-eq tx-sender .test-base-dao)"
    );
    expect(processed).toContain(
      "(contract-call? .test-base-dao is-extension contract-caller))"
    );
  });

  it("should handle multiple replacements in the same line", () => {
    const template = `
;; /g/TOKEN_NAME/token_name
;; /g/TOKEN_SYMBOL/token_symbol
(define-constant TOKEN_INFO {name: "TOKEN_NAME", symbol: "TOKEN_SYMBOL"})
`;

    const replacements = createReplacementsMap({
      "TOKEN_NAME/token_name": "Test Token",
      "TOKEN_SYMBOL/token_symbol": "TEST",
    });

    const processed = processContractTemplate(template, replacements);

    // Log the processed content for debugging
    dbgLog(`Processed template: ${processed}`);

    // Check that the replacements were made in the output
    expect(processed).toContain(
      '(define-constant TOKEN_INFO {name: "Test Token", symbol: "TEST"})'
    );

    // Check that the original tokens are not in the output (excluding the comment line)
    const outputLines = processed.trim().split("\n");
    const nonCommentLines = outputLines.filter(
      (line) => !line.trim().startsWith(";;")
    );
    const nonCommentOutput = nonCommentLines.join("\n");

    expect(nonCommentOutput).not.toContain("TOKEN_NAME");
    expect(nonCommentOutput).not.toContain("TOKEN_SYMBOL");
  });

  it("should handle replacements with special characters", () => {
    const template = `
;; /g/TOKEN_URI/token_uri
(define-data-var token-uri (optional (string-utf8 256)) (some u"TOKEN_URI"))
`;

    const replacements = createReplacementsMap({
      "TOKEN_URI/token_uri": "https://example.com/token.json?id=123&type=nft",
    });

    const processed = processContractTemplate(template, replacements);

    // Check that the replacement with special characters was made correctly
    expect(processed).toContain(
      '(define-data-var token-uri (optional (string-utf8 256)) (some u"https://example.com/token.json?id=123&type=nft"))'
    );
  });
});
