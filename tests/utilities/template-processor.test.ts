import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
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
    expect(processed).toContain("extension: .test-dao-charter");
    expect(processed).toContain("enabled: true");
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
    expect(processed).toContain("is-extension contract-caller)");
    expect(processed).toContain("ERR_NOT_DAO_OR_EXTENSION");
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
});

describe("Contract Generator", () => {
  let registry: ContractRegistry;
  let generator: ContractGeneratorService;
  let outputDir: string;

  // Standard replacements for tests - keys should be the simple `keyName`
  const replacements: Record<string, string> = {
    // Account addresses
    account_owner: "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
    account_agent: "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",

    // DAO Trait references
    dao_trait_extension: ".test-traits.extension",
    dao_trait_action_proposal_voting: ".test-traits.action-proposals-voting", // Note: value was .test-traits.action-proposals-voting, key was different
    dao_trait_action: ".test-traits.action",
    dao_trait_proposal: ".test-traits.proposal", // Note: value was .test-traits.proposal, key was different
    dao_trait_token_owner: ".test-traits.token-owner",
    dao_trait_faktory_dex: ".test-traits.faktory-dex", // Note: value was .test-traits.faktory-dex, key was different
    dao_trait_base: ".test-traits.base-dao",

    // Agent Trait references
    agent_account_trait_account:
      "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-traits.aibtc-account",
    // Note: key was different
    agent_account_trait_faktory_dex_approval:
      "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-traits.aibtc-faktory-dex",
    // Note: key was different
    agent_account_trait_proposals:
      "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-traits.aibtc-proposals",
    // Note: key was different
    agent_account_trait_faktory_buy_sell:
      "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-traits.faktory-buy-sell",

    // SIP Trait references
    base_trait_sip010: ".test-traits.sip010", // Note: key was different
    faktory_trait: ".test-traits.faktory-token", // Note: key was different, assuming 'faktory_trait' is the keyName

    // DAO contracts
    dao_contract_users: ".test-dao-users",
    dao_contract_treasury: ".test-treasury",
    dao_contract_token: ".test-token-contract",
    dao_contract_token_dex: ".test-dex-contract",
    dao_contract_base: ".test-base-dao",
    dao_contract_action_proposal_voting: ".test-proposal-voting",
    dao_contract_charter: ".test-dao-charter",
    dao_contract_epoch: ".test-dao-epoch",
    dao_contract_messaging: ".test-messaging",
    dao_token_owner_contract: ".test-token-owner", // Consider standardizing to dao_contract_token_owner if possible
    dao_action_send_message_contract: ".test-send-message", // Consider standardizing
    base_contract_dao_run_cost: ".test-dao-run-cost",
    dao_contract_rewards_account: ".test-rewards-account",

    // External contracts
    sbtc_contract: "ST000000000000000000002AMW42H.sbtc-token", // Note: key was different

    // Configuration values
    dao_manifest: "The mission of this DAO is to test template processing",
    dao_token_symbol: "TEST",
    // Add other simple keys that were previously in the "Simplified keys" section if they are distinct
    // and used by the contracts being tested (aibtc-action-proposal-voting, aibtc-agent-account, aibtc-base-initialize-dao)
    // For example, if these contracts use more specific trait keys like dao_trait_charter, dao_trait_epoch, etc.,
    // they should be included here with their test values.
    // The generateTemplateReplacements function is the source of truth for all standard keyNames.
    // It's best to align test replacements with those known keyNames.
    dao_trait_charter: ".test-traits.charter", // Example, add if needed by test contracts
    dao_trait_epoch: ".test-traits.epoch", // Example, add if needed
    // ... etc. for other specific traits or contract aliases used by the test contracts.
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
      // Ensure keys here are simple `keyName`s
      const singleContractReplacements = {
        ...replacements, // Main replacements map (already refactored)
        dao_trait_base: ".test-traits.base-dao", // Overriding for this specific test
        dao_trait_extension: ".test-traits.extension", // Overriding
        dao_token_symbol: "TEST_BASE_DAO", // Specific symbol for this test
        dao_contract_base: ".test-base-dao-override", // Specific contract base for this test
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

            dbgLog(
              `Error processing ${contractName}:\n${cleanedErrorMessage}`,
              { logType: "error", titleBefore: "Contract Processing Error" }
            );
          } else {
            dbgLog(`Error processing ${contractName}: ${error}`, {
              logType: "error",
              titleBefore: "Contract Processing Error",
            });
          }
          throw error; // Re-throw to fail the test
        }
      }
    }
  });

  it("TemplateScanner.scanAllTemplates should return no issues for a clean setup", async () => {
    // This test assumes that all contract dependencies and known template variables
    // are correctly defined, so the scanner should find no issues.
    // If this test fails, it indicates a mismatch between templates,
    // declared dependencies (contract-dependencies.ts), or known variables (template-variables.ts).

    const issues = await TemplateScanner.scanAllTemplates();

    // Save report for inspection if issues are found
    if (issues.length > 0) {
      const outputPath = path.join(
        outputDir,
        "template-scan-issues-report.json"
      );
      // Note: TemplateScanner.saveReportAsJson is async, ensure to await it if used here.
      // For simplicity in this test, we'll just log if issues are found.
      // await TemplateScanner.saveReportAsJson(issues, outputPath); // If you want to save it
      dbgLog(
        `Template scan found ${issues.length} issues. Full report available in template-scan-report.json if run via npm script.`,
        {
          logType: "error",
          titleBefore: "Template Scan Issues Found in Test",
        }
      );
      // Optionally print issues to console for easier debugging in test output
      TemplateScanner.printReport(issues);
    }

    expect(issues).toHaveLength(0);
  });
});

describe("TemplateScanner.validateContractReplacements", () => {
  let registry: ContractRegistry;

  beforeAll(() => {
    registry = new ContractRegistry();
    registry.registerAllDefinedContracts();
    // Dependencies are defined within TemplateScanner.validateContractReplacements
    // as it re-initializes the registry and defines dependencies.
  });

  it("should return valid: true for a contract with all replacements", () => {
    const contractName = "aibtc-base-dao"; // A contract known to exist
    // Use a comprehensive set of replacements, potentially from generateTemplateReplacements
    const testReplacements = generateTemplateReplacements("testnet");

    //console.log("====== Test Replacements ===");
    //console.log(testReplacements);
    //console.log("===========================");

    const result = TemplateScanner.validateContractReplacements(
      contractName,
      testReplacements
    );

    //console.log("====== Result ===");
    //console.log(result);
    //console.log("===========================");

    // If this assertion fails, Vitest will print the content of result.missingVariables
    expect(
      result.missingVariables,
      `Expected no missing variables for ${contractName}, but found some. Missing: ${JSON.stringify(
        result.missingVariables,
        null,
        2
      )}`
    ).toEqual([]);
    // result.valid is derived from missingVariables.length, so the above check also covers it.
    // We can keep this for clarity or remove it if the above is deemed sufficient.
    expect(
      result.valid,
      `Expected result.valid to be true for ${contractName} when no missing variables are expected. Missing: ${JSON.stringify(
        result.missingVariables,
        null,
        2
      )}`
    ).toBe(true);
  });

  it("should return valid: false and list missing variables for agent account", () => {
    const contractName = "aibtc-agent-account";
    const incompleteReplacements = generateTemplateReplacements(
      "testnet",
      "testcoin"
    );
    // Intentionally remove required replacements for agent accounts
    delete incompleteReplacements["account_owner"];
    delete incompleteReplacements["account_agent"];

    const result = TemplateScanner.validateContractReplacements(
      contractName,
      incompleteReplacements
    );
    expect(result.valid).toBe(false);
    expect(result.missingVariables.length).toBeGreaterThan(0);
    // Check that the specific missing keys are reported
    const missingKeysReported = result.missingVariables.join("\n");
    expect(missingKeysReported).toContain("account_owner");
    expect(missingKeysReported).toContain("account_agent");
  });

  it("should handle non-existent contract name", () => {
    const result = TemplateScanner.validateContractReplacements(
      "non-existent-contract",
      {}
    );
    expect(result.valid).toBe(false);
    expect(
      result.missingVariables.some((v) => v.includes("Contract not found"))
    ).toBe(true);
  });

  it("should handle contract with missing template file", () => {
    // Mock a contract to have a templatePath that doesn't exist
    const mockContractData = {
      name: "contract-with-bad-template",
      templatePath: "path/to/non-existent-template.clar",
      type: "BASE", // Minimal properties for ContractBase
      subtype: "DAO",
      deploymentOrder: 0,
    };

    // Temporarily adjust the registry's getContract method for this test
    const originalGetContract = registry.getContract;
    registry.getContract = vi.fn((name: string) => {
      if (name === mockContractData.name) {
        // Return a basic object that looks enough like a ContractBase instance
        // for the TemplateScanner.validateContractReplacements method.
        // The actual ContractBase methods won't be called if template loading fails first.
        return {
          name: mockContractData.name,
          templatePath: mockContractData.templatePath,
          type: mockContractData.type,
          subtype: mockContractData.subtype,
          deploymentOrder: mockContractData.deploymentOrder,
          // Add other properties if validateContractReplacements accesses them before template loading
        } as any;
      }
      return originalGetContract.call(registry, name);
    });

    const result = TemplateScanner.validateContractReplacements(
      mockContractData.name,
      {}
    );
    expect(result.valid).toBe(false);
    expect(
      result.missingVariables.some((v) => v.includes("Contract not found")),
      `Expected to find "Template not found" in missingVariables. Actual missingVariables: ${JSON.stringify(
        result.missingVariables,
        null,
        2
      )}`
    ).toBe(true);

    registry.getContract = originalGetContract; // Restore original method
  });
});
