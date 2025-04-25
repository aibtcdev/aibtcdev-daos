;; title: aibtc-user-agent-account-traits
;; version: 1.0.0
;; summary: A collection of traits for user agent accounts.

;; IMPORTS
(use-trait sip010-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait dao-action-trait .aibtc-dao-traits-v3.action)
(use-trait dao-proposal-trait .aibtc-dao-traits-v3.proposal)
(use-trait dao-action-proposals-trait .aibtc-dao-traits-v3.action-proposals)
(use-trait dao-core-proposals-trait .aibtc-dao-traits-v3.core-proposals)
(use-trait dao-faktory-dex .aibtc-dao-traits-v3.faktory-dex)
(use-trait faktory-token .faktory-trait-v1.sip-010-trait)

;; ACCOUNT TRAITS

(define-trait aibtc-account (
  ;; deposit STX to the agent account
  ;; @param amount amount of microSTX to deposit
  ;; @returns (response bool uint)
  (deposit-stx (uint) (response bool uint))
  ;; deposit FT to the agent account
  ;; @param ft the fungible token contract
  ;; @param amount amount of tokens to deposit
  ;; @returns (response bool uint)
  (deposit-ft (<sip010-trait> uint) (response bool uint))
  ;; withdraw STX from the agent account (owner only)
  ;; @param amount amount of microSTX to withdraw
  ;; @returns (response bool uint)
  (withdraw-stx (uint) (response bool uint))
  ;; withdraw FT from the agent account (owner only)
  ;; @param ft the fungible token contract
  ;; @param amount amount of tokens to withdraw
  ;; @returns (response bool uint)
  (withdraw-ft (<sip010-trait> uint) (response bool uint))
  ;; approve an asset for deposit/withdrawal (owner only)
  ;; @param asset the asset contract principal
  ;; @returns (response bool uint)
  (approve-asset (principal) (response bool uint))
  ;; revoke approval for an asset (owner only)
  ;; @param asset the asset contract principal
  ;; @returns (response bool uint)
  (revoke-asset (principal) (response bool uint))
))

(define-trait aibtc-proposals-v3 (
  ;; propose an action to the DAO (user or agent)
  ;; @param action-proposals the action proposals contract
  ;; @param action the action contract
  ;; @param parameters encoded action parameters
  ;; @returns (response bool uint)
  (acct-propose-action (<dao-action-proposals-trait> <dao-action-trait> (buff 2048) (optional (string-ascii 1024))) (response bool uint))
  ;; create a core proposal to the DAO (user or agent)
  ;; @param core-proposals the core proposals contract
  ;; @param proposal the proposal contract
  ;; @returns (response bool uint)
  (acct-create-proposal (<dao-core-proposals-trait> <dao-proposal-trait> (optional (string-ascii 1024))) (response bool uint))  
  ;; vote on an action proposal (user or agent)
  ;; @param action-proposals the action proposals contract
  ;; @param proposalId the proposal ID
  ;; @param vote true for yes, false for no
  ;; @returns (response bool uint)
  (vote-on-action-proposal (<dao-action-proposals-trait> uint bool) (response bool uint))
  ;; vote on a core proposal (user or agent)
  ;; @param core-proposals the core proposals contract
  ;; @param proposal the proposal contract
  ;; @param vote true for yes, false for no
  ;; @returns (response bool uint)
  (vote-on-core-proposal (<dao-core-proposals-trait> <dao-proposal-trait> bool) (response bool uint))
  ;; conclude an action proposal (user or agent)
  ;; @param action-proposals the action proposals contract
  ;; @param proposalId the proposal ID
  ;; @param action the action contract
  ;; @returns (response bool uint)
  (conclude-action-proposal (<dao-action-proposals-trait> uint <dao-action-trait>) (response bool uint))
  ;; conclude a core proposal (user or agent)
  ;; @param core-proposals the core proposals contract
  ;; @param proposal the proposal contract
  ;; @returns (response bool uint)
  (conclude-core-proposal (<dao-core-proposals-trait> <dao-proposal-trait>) (response bool uint))
))

(define-trait faktory-dex-approval (
  ;; approve a dex for trading an asset
  ;; @param faktory-dex the faktory dex contract
  ;; @returns (response bool uint)
  (acct-approve-dex (<dao-faktory-dex>) (response bool uint))
  ;; revoke approval for a dex
  ;; @param faktory-dex the faktory dex contract
  ;; @returns (response bool uint)
  (acct-revoke-dex (<dao-faktory-dex>) (response bool uint))
))

(define-trait faktory-buy-sell (
  ;; buy an asset from a faktory dex
  ;; @param faktory-dex the faktory dex contract
  ;; @param asset the asset contract principal
  ;; @param amount amount of tokens to buy
  ;; @returns (response bool uint)
  (acct-buy-asset (<dao-faktory-dex> <faktory-token> uint) (response bool uint))
  ;; sell an asset to a faktory dex
  ;; @param faktory-dex the faktory dex contract
  ;; @param asset the asset contract principal
  ;; @param amount amount of tokens to sell
  ;; @returns (response bool uint)
  (acct-sell-asset (<dao-faktory-dex> <faktory-token> uint) (response bool uint))
))
