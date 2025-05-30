;; title: aibtc-agent-account-traits
;; version: 1.0.0
;; summary: A collection of traits for smart contracts that manage agent accounts.

;; IMPORTS
(use-trait sip010-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait dao-action-trait .aibtc-dao-traits.action)
(use-trait dao-proposal-trait .aibtc-dao-traits.proposal)
(use-trait dao-action-proposal-trait .aibtc-dao-traits.action-proposal-voting)
(use-trait dao-faktory-dex .aibtc-dao-traits.faktory-dex)
(use-trait faktory-token 'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-trait-v1.sip-010-trait)

;; ACCOUNT TRAITS

(define-trait aibtc-account (
  (deposit-stx
    (uint)
    (response bool uint)
  )
  (deposit-ft
    (<sip010-trait> uint)
    (response bool uint)
  )
  (withdraw-stx
    (uint)
    (response bool uint)
  )
  (withdraw-ft
    (<sip010-trait> uint)
    (response bool uint)
  )
  (approve-asset
    (principal)
    (response bool uint)
  )
  (revoke-asset
    (principal)
    (response bool uint)
  )
))

(define-trait aibtc-proposals (
  (create-action-proposal
    (<dao-action-proposal-trait> <dao-action-trait> (buff 2048) (optional (string-ascii 1024)))
    (response bool uint)
  )
  (vote-on-action-proposal
    (<dao-action-proposal-trait> uint bool)
    (response bool uint)
  )
  (veto-action-proposal
    (<dao-action-proposal-trait> uint)
    (response bool uint)
  )
  (conclude-action-proposal
    (<dao-action-proposal-trait> uint <dao-action-trait>)
    (response bool uint)
  )
))

(define-trait faktory-dex-approval (
  (acct-approve-dex
    (<dao-faktory-dex>)
    (response bool uint)
  )
  (acct-revoke-dex
    (<dao-faktory-dex>)
    (response bool uint)
  )
))

(define-trait faktory-buy-sell (
  (acct-buy-asset
    (<dao-faktory-dex> <faktory-token> uint)
    (response bool uint)
  )
  (acct-sell-asset
    (<dao-faktory-dex> <faktory-token> uint)
    (response bool uint)
  )
))
