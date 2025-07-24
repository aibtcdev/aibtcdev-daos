# Plan for an Automated Documentation Generation Script

This plan outlines a Python script designed to automate the creation, review, and maintenance of Clarity contract documentation by orchestrating an LLM.

---

## Phase 1: Discovery and State Assessment

The script's first objective is to understand the current state of the repository by comparing source contracts with their documentation.

- [ ] **Build Contract Manifest:**
  - [ ] Recursively scan the `contracts/` directory for all `.clar` files.
  - [ ] Exclude specified paths (e.g., `contracts/test/`, `contracts/dao/traits/*`) to filter out non-documentable files.
  - [ ] Store the results as a list of canonical contract paths.

- [ ] **Build Documentation Manifest:**
  - [ ] Recursively scan the `docs/contracts/` directory for all `.md` files.
  - [ ] Store the results as a list of documentation paths.

- [ ] **Categorize Tasks:**
  - [ ] Compare the two manifests to create three task lists:
    - [ ] **To Create:** `.clar` files that have no corresponding `.md` file.
    - [ ] **To Review:** `.clar` files that have a corresponding `.md` file.
    - [ ] **To Prune:** `.md` files that have no corresponding `.clar` file.

---

## Phase 2: Execution and LLM Orchestration

The script will iterate through the categorized lists and perform the necessary actions.

- [ ] **Prune Orphaned Documentation:**
  - [ ] For each file in the **To Prune** list, delete the `.md` file.
  - [ ] Log which files were removed.

- [ ] **Create New Documentation:**
  - [ ] For each contract in the **To Create** list:
    - [ ] **Input:** The path to the `.clar` file and the appropriate template (`TEMPLATE_CONTRACT.md` or `TEMPLATE_TRAIT.md`).
    - [ ] **Action:**
        1. Read the content of the `.clar` file and the template file.
        2. Construct a prompt for the LLM instructing it to generate a complete documentation file by populating the template with information extracted from the Clarity code.
        3. Execute the LLM tool with the prompt and context.
        4. Save the generated markdown to the correct path within `docs/contracts/`.

- [ ] **Review Existing Documentation:**
  - [ ] For each contract in the **To Review** list:
    - [ ] **Input:** The path to the `.clar` file, the existing `.md` file, and the `REVIEW_CHECKLIST.md`.
    - [ ] **Action:**
        1. Read the content of all three input files.
        2. Construct a prompt for the LLM instructing it to act as a technical reviewer.
        3. The prompt should ask the LLM to compare the `.md` against the `.clar` file for accuracy and verify its structure against the `REVIEW_CHECKLIST.md`.
        4. Propose minimal, specific changes to fix any discrepancies or omissions.
        5. Execute the LLM tool with the prompt and context.
        6. Apply the LLM's proposed changes to the existing `.md` file.

---

## Phase 3: Navigation and Finalization

After all individual files are processed, the script will update the project's navigation to ensure discoverability.

- [ ] **Generate Table of Contents:**
  - [ ] **Input:** The final directory structure of `docs/contracts/`.
  - [ ] **Action:**
      1. Automatically generate the content for `SUMMARY.md` by traversing the documentation directory.
      2. Overwrite the existing `SUMMARY.md` with the newly generated, always-current table of contents.
