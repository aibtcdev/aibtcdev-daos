;; title: aibtc-dao-traits
;; version: 3.1.0
;; summary: A collection of traits for aibtc cohort 0.

;; IMPORTS
(use-trait faktory-token 'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-trait-v1.sip-010-trait)
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait nft-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; CORE DAO TRAITS

;; a one-time action proposed by token holders
(define-trait proposal (
  (execute (principal) (response bool uint))
))

;; a standing feature of the dao implemented in Clarity
(define-trait extension (
  (callback (principal (buff 34)) (response bool uint))
))

;; TOKEN TRAITS

;; the decentralized Bitflow trading pool following their xyk formula
(define-trait bitflow-pool (
  ;; transfer funds (we're just tagging this contract)
  ;; all functions are covered between sip-010 and bitflow-xyk
  (transfer (uint principal principal (optional (buff 34))) (response bool uint))
))

;; the decentralized exchange and initial bonding curve for a token
;; can be used to buy and sell tokens until the target is reached
;; liquidity is provided by the initial minting of tokens (20%)
;; reaching the target will trigger migration to the Bitflow pool
(define-trait faktory-dex (
  ;; buy tokens from the dex
  ;; @param ft the token contract
  ;; @param ustx the amount of microSTX to spend
  (buy (<faktory-token> uint) (response bool uint))
  ;; sell tokens to the dex
  ;; @param ft the token contract
  ;; @param amount the amount of tokens to sell
  (sell (<faktory-token> uint) (response bool uint))
))

;; the token contract for the dao, with no pre-mine or initial allocation
(define-trait token (
  ;; transfer funds (limited as we're just tagging this)
  (transfer (uint principal principal (optional (buff 34))) (response bool uint))
))

;; EXTENSION TRAITS

;; a pre-defined action that token holders can propose
(define-trait action (
  ;; @param parameters serialized hex-encoded Clarity values
  (run ((buff 2048)) (response bool uint))
  ;; @param parameters serialized hex-encoded Clarity values
  (check-parameters ((buff 2048)) (response bool uint))
))

;; a voting contract for whitelisted pre-defined actions
;; has lower voting threshold and quorum than core proposals
(define-trait action-proposals-voting (
  ;; propose a new action
  ;; @param action the action contract
  ;; @param parameters encoded action parameters
  (create-action-proposal (<action> (buff 2048) (optional (string-ascii 1024))) (response bool uint))
  ;; vote on an existing proposal
  ;; @param proposal the proposal id
  ;; @param vote true for yes, false for no
  (vote-on-action-proposal (uint bool) (response bool uint))
  ;; conclude a proposal after voting period
  ;; @param proposal the proposal id
  ;; @param action the action contract
  (conclude-action-proposal (uint <action>) (response bool uint))
))

;; an extension to manage the dao charter and mission
;; allows the dao to define its mission and values on-chain
;; used to guide decision-making and proposals
(define-trait charter (
  ;; set the dao charter
  ;; @param charter the new charter text
  (set-dao-charter ((string-ascii 4096)) (response bool uint))
))

;; a messaging contract that allows anyone to send public messages on-chain
;; messages can be up to 1MB in size and are printed as events that can be monitored
;; messages can verifiably indicate the sender is the dao by using a proposal
(define-trait messaging (
  ;; send a message on-chain (opt from DAO)
  ;; @param msg the message to send (up to 1MB)
  (send ((string-ascii 1047888)) (response bool uint))
))

;; an extension that manages the token on behalf of the dao
;; allows for same functionality normally used by deployer through proposals
(define-trait token-owner (
  ;; set the token URI
  ;; @param value the new token URI
  (set-token-uri ((string-utf8 256)) (response bool uint))
  ;; transfer ownership of the token
  ;; @param new-owner the new owner of the token
  (transfer-ownership (principal) (response bool uint))
))

;; an extension that manages STX, SIP-009 NFTs, and SIP-010 tokens
;; also supports stacking STX with Stacks Proof of Transfer
(define-trait treasury (
  ;; allow an asset for deposit/withdrawal
  ;; @param token the asset contract principal
  ;; @param enabled whether the asset is allowed
  (allow-asset (principal bool) (response bool uint))
  ;; deposit FT to the treasury
  ;; @param ft the fungible token contract principal
  ;; @param amount amount of tokens to deposit
  (deposit-ft (<ft-trait> uint) (response bool uint))
  ;; withdraw FT from the treasury
  ;; @param ft the fungible token contract principal
  ;; @param amount amount of tokens to deposit
  (withdraw-ft (<ft-trait> uint principal) (response bool uint))
))
