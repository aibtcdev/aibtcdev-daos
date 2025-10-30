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

- [x] **Prune Orphaned Documentation:**
  - [x] For each file in the **To Prune** list, delete the `.md` file using `os.remove()` or `pathlib.Path.unlink()`.
  - [x] Log which files were removed.

- [x] **Create New Documentation:**
  - [x] For each contract in the **To Create** list:
    - [x] **Setup:**
        1.  Identify the `.clar` file path.
        2.  Identify the appropriate template path (`TEMPLATE_CONTRACT.md` or `TEMPLATE_TRAIT.md`).
        3.  Determine the output path for the new `.md` file.
    - [x] **LLM Action:**
        1.  Instantiate an `aider.coders.Coder` object, providing the `.clar` file and the template as read-only context files.
        2.  Construct a detailed prompt instructing the LLM to create a new documentation file at the target path, using the template and the Clarity code as sources.
        3.  Use `coder.run()` to execute the request. Aider will create and write to the new documentation file.

- [x] **Review Existing Documentation:**
  - [x] For each contract in the **To Review** list:
    - [x] **Setup:**
        1.  Identify the paths for the `.clar` file, the existing `.md` file, and `REVIEW_CHECKLIST.md`.
    - [x] **LLM Action:**
        1.  Instantiate an `aider.coders.Coder` object. Add the `.md` file to the chat so it can be edited. Add the `.clar` file and `REVIEW_CHECKLIST.md` as read-only reference files.
        2.  Construct a prompt instructing the LLM to act as a technical reviewer, comparing the `.md` against the `.clar` file for accuracy and against the checklist for structure.
        3.  Use `coder.run()` to execute the review. Aider will apply the necessary changes directly to the `.md` file.

---

## Phase 3: Navigation and Finalization

After all individual files are processed, the script will update the project's navigation to ensure discoverability.

- [x] **Generate Table of Contents:**
  - [x] **Input:** The final directory structure of `docs/contracts/`.
  - [x] **Action:**
      1. Automatically generate the content for `SUMMARY.md` by traversing the documentation directory.
      2. Overwrite the existing `SUMMARY.md` with the newly generated, always-current table of contents.
