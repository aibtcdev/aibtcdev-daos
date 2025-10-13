# Project: Automated Documentation Script

This file marks the beginning of the project to create an automated documentation script. The goal is to translate the manual, AI-assisted documentation process into a repeatable Python script that can be run to keep documentation in sync with the source code.

This script will orchestrate an LLM to perform the following tasks:
1.  Discover all Clarity contracts and their corresponding documentation.
2.  Create new documentation for undocumented contracts.
3.  Review existing documentation for accuracy against the latest source code.
4.  Prune documentation for contracts that no longer exist.
5.  Automatically update the project's table of contents (`SUMMARY.md`).

## Project Artifacts

The process and structure for this project are captured in the following files:

- **[README.md](./README.md)**: An overview of this sub-project.
- **[PLANS.md](./PLANS.md)**: The detailed, step-by-step plan for creating the script.
- **[QUESTIONS.md](./QUESTIONS.md)**: A log of questions and decisions made during the project.
- **[END.md](./END.md)**: A retrospective to be filled out upon completion.
