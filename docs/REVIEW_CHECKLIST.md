# Documentation Review Checklist

Use this checklist for each contract and trait documentation file to ensure consistency, accuracy, and clarity.

## File: `[Path to file under review]`

### 1. Template Adherence

- [ ] **File Name:** The file is named correctly (e.g., `[contract-name].md`).
- [ ] **Source Link:** The link to the source `.clar` file is correct and working.
- [ ] **Headings:** All required sections from the template (`TEMPLATE_CONTRACT.md` or `TEMPLATE_TRAIT.md`) are present and in the correct order.
- [ ] **Formatting:** Markdown formatting (code blocks, lists, links) is used correctly.

### 2. Content Accuracy

- [ ] **Overview:** The overview accurately summarizes the contract's or trait's purpose.
- [ ] **Functions:**
    - [ ] All public, read-only, and private functions are listed.
    - [ ] Function signatures are correct.
    - [ ] Parameter names, types, and descriptions are accurate.
    - [ ] Return value descriptions (for `(ok ...)` and `(err ...)`) are correct.
- [ ] **Called Contracts:** The list of called contracts is complete and the descriptions are accurate.
- [ ] **State (Variables, Maps, Constants):** All state elements are documented correctly.
- [ ] **Errors:** Custom error codes are listed and their meanings are correct.
- [ ] **Print Events:** SIP-019 print events are documented correctly.
- [ ] **Implementations (for Traits):** The list of implementing contracts is accurate.

### 3. Clarity and Readability

- [ ] **Clarity:** Descriptions are clear, concise, and written for a developer audience.
- [ ] **Grammar and Spelling:** The document is free of significant grammatical errors and typos.
- [ ] **Consistency:** Terminology is used consistently within the document and across the entire documentation set.

### 4. Navigation and Links

- [ ] **Internal Links:** Links to other functions within the same document are working correctly.
- [ ] **External Links:** Links to other documentation files or external resources are correct.
