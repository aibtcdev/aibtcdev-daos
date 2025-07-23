# Documentation for aibtcdev-daos

This file is our starting point. This directory is our working directory.

We will work back and forth with question then commit the changes at key milestones.

We want to perform a comprehensive review of the `../contracts` directory and every Clarity `.clar` file within.

The review will include analyzing each contract's functions and creating condensed functional documentation for developers.

To maintain consistency a `TEMPLATE_*.md` file can be created for each type of documentation.

## Internal Structure

For our working directory, we can create new files as needed to document our findings, questions, and code changes. For example:

- `QUESTIONS.md` for questions that arise during the review
- `PLANS.md` for outlining next steps and action items
- items by topic, such as `TEMPLATE_*.md` for specific documentation templates

Our end goal is to create a structure here in `./docs` that mirrors the structure of the `../contracts` directory, such that:

- every Clarity contract has a corresponding documentation file, we can add a script to `../tests` to automate this
- contracts are documented consistently and explain their purpose, functionality, and any special considerations
- every folder in `../docs` contains a `README.md` that explains the contents and purpose of that folder
- every `README.md` file should link to one level above and below where applicable, to maintain a clear navigation structure

Markdown is preferred, text is king.

## Proposed Process

Our plan should start by creating the test that will show us which clarity files are missing documentation, using the same format and style as the existing check for corresponding test files.

Once we have the results of that test we can use that list to create a checklist to iterate on and decide the template format for each type of documentation. We want to start simple and focus on maximizing the reader's time. The intended audience is developers who will be working with the contracts, so clarity and conciseness are key.

This documentation should be a living document, where we will re-run this process to update it as contracts change or new contracts are added. We can use the existing Clarity contract code as a starting point for each contract's documentation.

## Proposed Structure

1. Create a `README.md` in the root of the `docs` directory to explain how to navigate dev docs, most useful info at landing.
2. Create a `TEMPLATE_*.md` file for each type of documentation needed.
3. Create a `QUESTIONS.md` file to track questions and issues that arise during the review.
4. Create a `PLANS.md` file to outline next steps and action items. use markdown task lists for tracking progress and iterations. add/modify as necessary throughout the process but keep data for retrospective at end.
5. Create a `SUMMARY.md` file in the root of the `docs` directory that lists all contracts and links to their documentation. Basically a TOC similar to GitBook format.
6. Create a `README.md` in each subdirectory of `docs` to explain the contents and purpose of that folder. Make it useful for navigation and understanding the structure and expect it to be linked to from the `SUMMARY.md` as well as 1 level above and below where applicable.
7. Create a script in `../tests` to automate the generation of documentation files based on the Clarity contracts in `../contracts`
