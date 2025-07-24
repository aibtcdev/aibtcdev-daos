#!/usr/bin/env python

import argparse
import os
from pathlib import Path

# Placeholder for aider imports, to be used in Phase 2
# from aider.coders import Coder
# from aider.io import InputOutput
# from aider.models import Model

# Define constants for paths
# Assumes the script is in docs/script/
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
CONTRACTS_DIR = ROOT_DIR / "contracts"
DOCS_DIR = ROOT_DIR / "docs" / "contracts"
TEMPLATES_DIR = ROOT_DIR / "docs" / "templates"
REVIEW_CHECKLIST_PATH = ROOT_DIR / "docs" / "REVIEW_CHECKLIST.md"

EXCLUDE_PATHS = [
    "contracts/test",
    "contracts/dao/traits",
]

def build_contract_manifest():
    """
    Recursively scans the contracts/ directory for all .clar files,
    excluding specified paths.
    """
    all_contracts = set(CONTRACTS_DIR.rglob("*.clar"))
    
    abs_exclude_paths = [ROOT_DIR / p for p in EXCLUDE_PATHS]
    
    contract_manifest = {
        p for p in all_contracts 
        if not any(p.is_relative_to(ep) for ep in abs_exclude_paths)
    }
    
    return contract_manifest

def build_doc_manifest():
    """
    Recursively scans the docs/contracts/ directory for all .md files.
    """
    return set(DOCS_DIR.rglob("*.md"))

def get_doc_path_for_contract(contract_path: Path) -> Path:
    """
    Calculates the corresponding documentation path for a given contract path.
    Example: contracts/foo/bar.clar -> docs/contracts/foo/bar.md
    """
    relative_contract_path = contract_path.relative_to(CONTRACTS_DIR)
    doc_path = DOCS_DIR / relative_contract_path
    return doc_path.with_suffix(".md")

def categorize_tasks(contract_manifest, doc_manifest):
    """
    Compares contract and documentation manifests to create task lists.
    """
    to_create = []
    to_review = []
    
    doc_map = {doc.resolve(): None for doc in doc_manifest}

    for contract_path in contract_manifest:
        expected_doc_path = get_doc_path_for_contract(contract_path).resolve()
        if expected_doc_path in doc_map:
            to_review.append((contract_path, Path(expected_doc_path)))
            doc_map[expected_doc_path] = contract_path
        else:
            to_create.append(contract_path)

    to_prune = [Path(doc) for doc, contract in doc_map.items() if contract is None]

    return to_create, to_review, to_prune

def prune_docs(docs_to_prune, dry_run=False):
    """Prunes documentation files that no longer have a corresponding contract."""
    if not docs_to_prune:
        print("No documents to prune.")
        return

    print(f"\nPruning {len(docs_to_prune)} orphaned documents...")
    for doc_path in docs_to_prune:
        print(f"  - {doc_path.relative_to(ROOT_DIR)}")
        if not dry_run:
            try:
                os.remove(doc_path)
            except OSError as e:
                print(f"    Error removing file: {e}")

def create_documentation(contracts_to_create, model_name, dry_run=False):
    """Creates documentation for new contracts using aider."""
    if not contracts_to_create:
        print("No new contracts to document.")
        return
    
    print(f"\nCreating documentation for {len(contracts_to_create)} new contracts...")
    # Placeholder for Phase 2 implementation
    pass

def review_documentation(contracts_to_review, model_name, dry_run=False):
    """Reviews existing documentation for accuracy against the source code."""
    if not contracts_to_review:
        print("No documents to review.")
        return

    print(f"\nReviewing {len(contracts_to_review)} existing documents...")
    # Placeholder for Phase 2 implementation
    pass

def generate_summary_md(dry_run=False):
    """Generates the SUMMARY.md file for the docs."""
    print("\nGenerating SUMMARY.md...")
    # Placeholder for Phase 3 implementation
    pass

def main():
    parser = argparse.ArgumentParser(description="Automated Clarity contract documentation generator.")
    parser.add_argument("--dry-run", action="store_true", help="Perform a dry run without making changes.")
    parser.add_argument("--specific-contract", type=str, help="Process only a specific contract file (path from repo root).")
    parser.add_argument("--model", type=str, default="gpt-4-turbo", help="Specify the LLM model to use.")
    
    args = parser.parse_args()

    print("Starting documentation generation script...")

    # Phase 1: Discovery and State Assessment
    print("\nPhase 1: Discovering contracts and documentation...")
    contract_manifest = build_contract_manifest()
    doc_manifest = build_doc_manifest()

    if args.specific_contract:
        specific_contract_path = (ROOT_DIR / args.specific_contract).resolve()
        
        contract_manifest = {p for p in contract_manifest if p.resolve() == specific_contract_path}
        
        if not contract_manifest:
            print(f"Error: {args.specific_contract} is not a valid or included contract.")
            return
        
        to_create, to_review, _ = categorize_tasks(contract_manifest, doc_manifest)
        to_prune = []
    else:
        to_create, to_review, to_prune = categorize_tasks(contract_manifest, doc_manifest)

    print(f"Found {len(to_create)} contracts to document.")
    print(f"Found {len(to_review)} documents to review.")
    print(f"Found {len(to_prune)} documents to prune.")

    # Phase 2: Execution
    print("\nPhase 2: Executing documentation tasks...")
    prune_docs(to_prune, args.dry_run)
    create_documentation(to_create, args.model, args.dry_run)
    review_documentation(to_review, args.model, args.dry_run)

    # Phase 3: Finalization
    print("\nPhase 3: Finalizing documentation...")
    generate_summary_md(args.dry_run)

    print("\nDocumentation generation script finished.")

if __name__ == "__main__":
    main()
