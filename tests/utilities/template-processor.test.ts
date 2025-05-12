import { describe, it, expect } from "vitest";
import {
  processContractTemplate,
  createReplacementsMap,
} from "../../utilities/template-processor";

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
});
