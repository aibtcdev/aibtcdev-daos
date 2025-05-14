import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { dbgLog } from "../../utilities/debug-logging";
import { ContractRegistry } from "../../utilities/contract-registry";
import { ContractGeneratorService } from "../../src/services/contract-generator";
import { TemplateScanner } from "../../utilities/template-scanner";
import {
  createReplacementsMap,
  processContractTemplate,
  getContractTemplateContent,
} from "../../utilities/template-processor";
import { generateTemplateReplacements } from "../../utilities/template-variables";

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
      account_owner: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
      account_agent: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
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

;; traits
;; /g/.aibtc-agent-account-traits.aibtc-account/agent_account_trait_account
(impl-trait .aibtc-agent-account-traits.aibtc-account)
;; /g/.aibtc-agent-account-traits.aibtc-faktory-dex/agent_account_trait_faktory_dex_approval
(impl-trait .aibtc-agent-account-traits.aibtc-faktory-dex)
;; /g/SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait/base_trait_sip010
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

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
;; /g/.aibtc-dao-traits.proposal/dao_trait_proposal
(use-trait proposal-trait .aibtc-dao-traits.proposal)
;; /g/.aibtc-dao-traits.faktory-dex/dao_trait_faktory_dex
(use-trait dao-faktory-dex .aibtc-dao-traits.faktory-dex)
;; /g/aibtc/dao_token_symbol
(define-constant TOKEN_SYMBOL "aibtc")
`;

    const replacements = createReplacementsMap({
      account_owner: "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
      account_agent: "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
      dao_contract_token: ".test-token-contract",
      dao_contract_token_dex: ".test-dex-contract",
      sbtc_contract: "ST000000000000000000002AMW42H.sbtc-token",
      agent_account_trait_account: ".test-traits.agent-account",
      agent_account_trait_faktory_dex_approval:
        ".test-traits.faktory-dex-approval",
      base_trait_sip010: ".test-traits.sip010",
      dao_trait_proposal: ".test-traits.proposal",
      dao_trait_faktory_dex: ".test-traits.faktory-dex",
      dao_token_symbol: "TEST",
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

  it("should process DAO initialize proposal template", async () => {
    // Create a mock contract object
    const mockContract = {
      name: "aibtc-base-initialize-dao",
      type: "PROPOSALS",
      subtype: "INITIALIZE_DAO",
      templatePath: "dao/proposals/aibtc-base-initialize-dao.clar",
    };

    // Read the template content directly
    const templateContent = await getContractTemplateContent(mockContract);

    const replacements = createReplacementsMap({
      dao_manifest: "The mission of this DAO is to test template processing",
      dao_contract_token: ".test-token-contract",
      dao_contract_base: ".test-base-dao",
      dao_contract_action_proposal_voting: ".test-proposal-voting",
      dao_contract_charter: ".test-dao-charter",
      dao_contract_epoch: ".test-dao-epoch",
      dao_contract_users: ".test-dao-users",
      dao_contract_messaging: ".test-messaging",
      dao_token_owner_contract: ".test-token-owner",
      dao_contract_treasury: ".test-treasury",
      dao_action_send_message_contract: ".test-send-message",
      dao_token_symbol: "TEST",
    });

    const processed = processContractTemplate(templateContent!, replacements);

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
    expect(processed).toContain("extension: .test-proposal-voting");
    expect(processed).toContain("enabled: true");
    expect(processed).toContain(
      "extension: .test-dao-charter"
    );
    expect(processed).toContain(
      "enabled: true"
    );
    expect(processed).toContain('notification: "TEST-base-dao/execute"');
  });

  it("should process token owner template", async () => {
    // Create a mock contract object
    const mockContract = {
      name: "aibtc-token-owner",
      type: "EXTENSIONS",
      subtype: "TOKEN_OWNER",
      templatePath: "dao/extensions/aibtc-token-owner.clar",
    };

    // Read the template content directly
    const templateContent = await getContractTemplateContent(mockContract);

    const replacements = createReplacementsMap({
      dao_trait_extension: ".test-traits.extension",
      dao_trait_token_owner: ".test-traits.token-owner",
      dao_contract_token: ".test-token-contract",
      dao_contract_base: ".test-base-dao",
      dao_token_symbol: "TEST",
    });

    const processed = processContractTemplate(templateContent!, replacements);

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
    expect(processed).toContain("is-eq tx-sender .test-base-dao");
    expect(processed).toContain(
      "contract-call? .test-base-dao is-extension contract-caller"
    );
    expect(processed).toContain(
      "is-extension contract-caller)"
    );
    expect(processed).toContain(
      "ERR_NOT_DAO_OR_EXTENSION"
    );
  });

  it("should handle multiple replacements in the same line", () => {
    const template = `
;; /g/TOKEN_NAME/token_name
;; /g/TOKEN_SYMBOL/token_symbol
(define-constant TOKEN_INFO {name: "TOKEN_NAME", symbol: "TOKEN_SYMBOL"})
`;

    const replacements = createReplacementsMap({
      token_name: "Test Token",
      token_symbol: "TEST",
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
      token_uri: "https://example.com/token.json?id=123&type=nft",
    });

    const processed = processContractTemplate(template, replacements);

    // Check that the replacement with special characters was made correctly
    expect(processed).toContain(
      '(define-data-var token-uri (optional (string-utf8 256)) (some u"https://example.com/token.json?id=123&type=nft"))'
    );
  });
  it("should generate template replacements for different networks", () => {
    // Test for different networks
    const mainnetReplacements = generateTemplateReplacements(
      "mainnet",
      "aibtc"
    );
    const testnetReplacements = generateTemplateReplacements(
      "testnet",
      "aibtc"
    );
    const devnetReplacements = generateTemplateReplacements("devnet", "aibtc");

    // Verify network-specific values are different
    expect(
      mainnetReplacements[".aibtc-dao-traits.extension/dao_trait_extension"]
    ).not.toEqual(
      testnetReplacements[".aibtc-dao-traits.extension/dao_trait_extension"]
    );

    // Verify token symbol is used correctly
    expect(mainnetReplacements["aibtc/dao_token_symbol"]).toBe("AIBTC");

    // Test with custom token symbol
    const customReplacements = generateTemplateReplacements("devnet", "test");
    expect(customReplacements["test/dao_token_symbol"]).toBe("TEST");
    expect(customReplacements[".aibtc-faktory/dao_contract_token"]).toBe(
      ".test-faktory"
    );

    // Test with custom replacements
    const withCustom = generateTemplateReplacements("devnet", "aibtc", {
      "custom/variable": "custom-value",
      "aibtc/dao_token_symbol": "OVERRIDE",
    });

    expect(withCustom["custom/variable"]).toBe("custom-value");
    expect(withCustom["aibtc/dao_token_symbol"]).toBe("OVERRIDE");

    // Save the replacements for inspection
    const outputDir = path.join(
      process.cwd(),
      "generated-contracts/test-output"
    );
    const outputPath = path.join(outputDir, "template-replacements.json");
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          mainnet: mainnetReplacements,
          testnet: testnetReplacements,
          devnet: devnetReplacements,
          custom: customReplacements,
          withCustomOverrides: withCustom,
        },
        null,
        2
      )
    );
  });
});

describe("Contract Generator", () => {
  let registry: ContractRegistry;
  let generator: ContractGeneratorService;
  let outputDir: string;

  // Standard replacements for tests
  const replacements: Record<string, string> = {
    // Account addresses
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/account_owner":
      "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
    "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG/account_agent":
      "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",

    // DAO Trait references
    ".aibtc-dao-traits.extension/dao_trait_extension": ".test-traits.extension",
    ".aibtc-dao-traits.action/dao_trait_action_proposals_voting":
      ".test-traits.action-proposals-voting",
    ".aibtc-dao-traits.action/dao_trait_action": ".test-traits.action",
    ".aibtc-dao-traits.proposal/dao_trait_proposal": ".test-traits.proposal",
    ".aibtc-dao-traits.token-owner/dao_trait_token_owner":
      ".test-traits.token-owner",
    ".aibtc-dao-traits.faktory-dex/dao_trait_faktory_dex":
      ".test-traits.faktory-dex",
    ".aibtc-base-dao-trait.aibtc-base-dao/dao_trait_base":
      ".test-traits.base-dao",

    // Agent Trait references
    ".aibtc-agent-account-traits.aibtc-account/agent_account_trait_account":
      ".test-traits.agent-account",
    ".aibtc-agent-account-traits.faktory-dex/agent_account_trait_faktory_dex_approval":
      ".test-traits.faktory-dex-approval",
    ".aibtc-agent-account-traits.aibtc-proposals/agent_account_trait_proposals":
      ".test-traits.agent-proposals",
    ".aibtc-agent-account-traits.faktory-buy-sell/agent_account_trait_faktory_buy_sell":
      ".test-traits.faktory-buy-sell",

    // SIP Trait references
    "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait/base_trait_sip010":
      ".test-traits.sip010",
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-trait-v1.sip-010-trait/faktory_trait":
      ".test-traits.faktory-token",

    // DAO contracts
    ".aibtc-dao-users/dao_contract_users": ".test-dao-users",
    ".aibtc-treasury/dao_contract_treasury": ".test-treasury",
    ".aibtc-faktory/dao_contract_token": ".test-token-contract",
    ".aibtc-faktory-dex/dao_contract_token_dex": ".test-dex-contract",
    ".aibtc-base-dao/dao_contract_base": ".test-base-dao",
    ".aibtc-action-proposal-voting/dao_contract_action_proposal_voting":
      ".test-proposal-voting",
    ".aibtc-dao-charter/dao_contract_charter": ".test-dao-charter",
    ".aibtc-dao-epoch/dao_contract_epoch": ".test-dao-epoch",
    ".aibtc-onchain-messaging/dao_contract_messaging": ".test-messaging",
    ".aibtc-token-owner/dao_token_owner_contract": ".test-token-owner",
    ".aibtc-action-send-message/dao_action_send_message_contract":
      ".test-send-message",
    ".dao-run-cost/base_contract_dao_run_cost": ".test-dao-run-cost",
    ".aibtc-rewards-account/dao_contract_rewards_account":
      ".test-rewards-account",

    // External contracts
    "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/sbtc_contract":
      "ST000000000000000000002AMW42H.sbtc-token",

    // Configuration values
    "dao mission goes here/dao_manifest":
      "The mission of this DAO is to test template processing",
    "aibtc/dao_token_symbol": "TEST",

    // Simplified keys for template variables
    dao_trait_extension: ".test-traits.extension",
    dao_trait_action: ".test-traits.action",
    base_contract_dao_run_cost: ".test-dao-run-cost",
    dao_contract_treasury: ".test-treasury",
    dao_contract_token: ".test-token-contract",
    dao_contract_users: ".test-dao-users",
    dao_contract_base: ".test-base-dao",
    dao_token_symbol: "TEST",
    dao_trait_base: ".test-traits.base-dao",
    dao_contract_action_proposal_voting: ".test-proposal-voting",
    dao_contract_epoch: ".test-dao-epoch",
    dao_contract_messaging: ".test-messaging",
    dao_contract_charter: ".test-dao-charter",
    dao_token_owner_contract: ".test-token-owner",
    dao_action_send_message_contract: ".test-send-message",

    // Agent account simplified keys
    agent_account_trait_account: ".test-traits.agent-account",
    agent_account_trait_faktory_dex_approval:
      ".test-traits.faktory-dex-approval",
    base_trait_sip010: ".test-traits.sip010",
    dao_trait_proposal: ".test-traits.proposal",
    dao_trait_faktory_dex: ".test-traits.faktory-dex",
    account_owner: "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
    account_agent: "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
  };

  beforeAll(() => {
    registry = new ContractRegistry();
    registry.registerAllDefinedContracts();

    generator = new ContractGeneratorService();

    // Create output directory for test results
    outputDir = path.join(process.cwd(), "generated-contracts/test-output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  it("should process a single contract template", async () => {
    const contractName = "aibtc-base-dao";
    const contract = registry.getContract(contractName);

    expect(contract).not.toBeUndefined();

    if (contract) {
      // Add all necessary replacements for this contract
      const singleContractReplacements = {
        ...replacements,
        ".aibtc-base-dao-trait.aibtc-base-dao/dao_trait_base":
          ".test-traits.base-dao",
        ".aibtc-dao-traits.extension/dao_trait_extension":
          ".test-traits.extension",
        "aibtc/dao_token_symbol": "TEST",
        ".aibtc-base-dao/dao_contract_base": ".test-base-dao",
      };

      try {
        const content = await generator.generateContract(
          contract,
          singleContractReplacements
        );

        // Basic validation
        expect(content).toBeTruthy();
        expect(content.length).toBeGreaterThan(0);

        // Save for inspection
        const outputPath = path.join(outputDir, `${contract.name}.clar`);
        fs.writeFileSync(outputPath, content);
      } catch (error) {
        // Format error message consistently
        if (error instanceof Error) {
          const errorLines = error.message.split("\n");
          const cleanedErrorMessage = errorLines
            .filter(
              (line) =>
                line.includes("MISSING TEMPLATE VARIABLE") ||
                line.startsWith("key:") ||
                line.startsWith("replaces:")
            )
            .join("\n");

          dbgLog(`Error processing ${contractName}:\n${cleanedErrorMessage}`, {
            logType: "error",
            titleBefore: "Contract Processing Error",
          });
        } else {
          dbgLog(
            `Error processing ${contractName}: ${
              error instanceof Error ? error.message : String(error)
            }`,
            { logType: "error", titleBefore: "Contract Processing Error" }
          );
        }
        throw error; // Re-throw to fail the test
      }
    }
  });

  it("should process DAO and Agent contracts", async () => {
    const contractsToTest = [
      "aibtc-action-proposal-voting",
      "aibtc-agent-account",
      "aibtc-base-initialize-dao",
    ];

    // Since we've updated the standard replacements to be comprehensive,
    // we can just use them directly
    const extendedReplacements = replacements;

    for (const contractName of contractsToTest) {
      const contract = registry.getContract(contractName);

      expect(contract).not.toBeUndefined();

      if (contract) {
        try {
          const content = await generator.generateContract(
            contract,
            extendedReplacements
          );

          // Basic validation
          expect(content).toBeTruthy();
          expect(content.length).toBeGreaterThan(0);

          // Save for inspection
          const outputPath = path.join(outputDir, `${contract.name}.clar`);
          fs.writeFileSync(outputPath, content);
        } catch (error) {
          // Only show the error message without the stack trace
          if (error instanceof Error) {
            // Extract just the missing variables part without the full contract code
            const errorLines = error.message.split("\n");
            const cleanedErrorMessage = errorLines
              .filter(
                (line) =>
                  line.includes("MISSING TEMPLATE VARIABLE") ||
                  line.startsWith("key:") ||
                  line.startsWith("replaces:")
              )
              .join("\n");

            console.error(
              `Error processing ${contractName}:\n${cleanedErrorMessage}`
            );
          } else {
            console.error(`Error processing ${contractName}:`, error);
          }
          throw error; // Re-throw to fail the test
        }
      }
    }
  });

  it("should generate a variable report", async () => {
    const report = await TemplateScanner.scanAllTemplates();

    // Basic validation
    expect(report).toBeTruthy();
    expect(Object.keys(report).length).toBeGreaterThan(0);

    // Get the unique variables
    const uniqueVariables = [...new Set(Object.values(report).flat())];
    const knownVariables = TemplateScanner.getKnownTemplateVariables();
    const unknownVariables = uniqueVariables.filter(
      (variable) => !knownVariables.includes(variable)
    );

    // Format the report for better readability
    const formattedReport = {
      summary: {
        totalContracts: Object.keys(report).length,
        totalUniqueVariables: uniqueVariables.length,
        knownVariables: knownVariables.length,
        unknownVariables: unknownVariables.length,
      },
      knownVariables: knownVariables,
      unknownVariables: unknownVariables,
      contractVariables: report,
    };

    // Save for inspection
    const outputPath = path.join(outputDir, "template-variables-report.json");
    fs.writeFileSync(outputPath, JSON.stringify(formattedReport, null, 2));

    dbgLog(
      `Variable report generated with ${formattedReport.summary.totalUniqueVariables} unique variables across ${formattedReport.summary.totalContracts} contracts`,
      { titleBefore: "Variable Report Summary" }
    );

    if (unknownVariables.length > 0) {
      dbgLog(`Found ${unknownVariables.length} unknown variables:`, {
        titleBefore: "Unknown Variables",
      });
      dbgLog(unknownVariables);
    }
  });
});
