/**
 * This file contains example contract templates for testing the template processor
 */

export const agentAccountTemplate = `
;; title: aibtc-agent-account
;; version: 1.0.0
;; summary: A special account contract between a user and an agent for managing assets and DAO interactions. Only the user can withdraw funds.

;; traits
(impl-trait .aibtc-agent-account-traits.aibtc-account)
(impl-trait .aibtc-agent-account-traits.aibtc-proposals)
(impl-trait .aibtc-agent-account-traits.faktory-dex-approval)
(impl-trait .aibtc-agent-account-traits.faktory-buy-sell)
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(use-trait action-trait .aibtc-dao-traits.action)
(use-trait proposal-trait .aibtc-dao-traits.proposal)
(use-trait action-proposals-voting-trait .aibtc-dao-traits.action-proposals-voting)
(use-trait dao-faktory-dex .aibtc-dao-traits.faktory-dex)
(use-trait faktory-token 'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-trait-v1.sip-010-trait)

;; constants
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; owner and agent addresses
;; /g/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/account_owner
(define-constant ACCOUNT_OWNER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM) ;; owner (user/creator of account, full access)
;; /g/ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG/account_agent
(define-constant ACCOUNT_AGENT 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG) ;; agent (can only take approved actions)

;; pre-approved contracts
;; /g/STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/sbtc_contract
(define-constant SBTC_TOKEN 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token) ;; sBTC token
;; /g/.aibtc-faktory/dao_token_contract
(define-constant DAO_TOKEN .aibtc-faktory) ;; DAO token
;; /g/.aibtc-faktory-dex/dao_token_dex_contract
(define-constant DAO_TOKEN_DEX .aibtc-faktory-dex) ;; DAO token DEX

;; error codes
(define-constant ERR_UNAUTHORIZED (err u1100))
(define-constant ERR_UNKNOWN_ASSET (err u1101))
(define-constant ERR_OPERATION_FAILED (err u1102))
(define-constant ERR_BUY_SELL_NOT_ALLOWED (err u1103))
`;

export const initializeDaoTemplate = `
;; title: aibtc-base-initialize-dao
;; version: 1.0.0
;; summary: A proposal that sets up the initial DAO configuration and extensions.

;; /g/.aibtc-dao-traits.proposal/dao_proposal_trait
(impl-trait .aibtc-dao-traits.proposal)

;; /g/dao mission goes here/dao_manifest
(define-constant CFG_DAO_MANIFEST_TEXT "dao mission goes here")
;; /g/.aibtc-faktory/dao_token_contract
(define-constant CFG_DAO_TOKEN .aibtc-faktory)

(define-public (execute (sender principal))
  (begin
    ;; set initial dao extensions list
    ;; /g/.aibtc-base-dao/dao_base_contract
    (try! (contract-call? .aibtc-base-dao set-extensions
      (list
        ;; initial DAO extensions (features)
        ;; /g/.aibtc-action-proposal-voting/dao_action_proposal_voting_contract
        {extension: .aibtc-action-proposal-voting, enabled: true}
        ;; /g/.aibtc-dao-charter/dao_charter_contract
        {extension: .aibtc-dao-charter, enabled: true}
        ;; /g/.aibtc-dao-epoch/dao_epoch_contract
        {extension: .aibtc-dao-epoch, enabled: true}
        ;; /g/.aibtc-dao-users/dao_users_contract
        {extension: .aibtc-dao-users, enabled: true}
        ;; /g/.aibtc-onchain-messaging/dao_messaging_contract
        {extension: .aibtc-onchain-messaging, enabled: true}
        ;; /g/.aibtc-token-owner/dao_token_owner_contract
        {extension: .aibtc-token-owner, enabled: true}
        ;; /g/.aibtc-treasury/dao_treasury_contract
        {extension: .aibtc-treasury, enabled: true}
        ;; initial action proposals (as extensions)
        ;; /g/.aibtc-action-send-message/dao_action_send_message_contract
        {extension: .aibtc-action-send-message, enabled: true}
      )
    ))
    ;; allow asset in treasury
    ;; /g/.aibtc-treasury/dao_treasury_contract
    (try! (contract-call? .aibtc-treasury allow-asset CFG_DAO_TOKEN true))
    ;; set DAO manifest in dao-charter extension
    ;; /g/.aibtc-dao-charter/dao_charter_contract
    (try! (contract-call? .aibtc-dao-charter set-dao-charter CFG_DAO_MANIFEST_TEXT))
    ;; send DAO manifest as onchain message
    ;; /g/.aibtc-onchain-messaging/dao_messaging_contract
    (try! (contract-call? .aibtc-onchain-messaging send CFG_DAO_MANIFEST_TEXT))
    ;; print manifest data
    (print {
      ;; /g/aibtc/dao_token_symbol
      notification: "aibtc-base-dao/execute",
      payload: {
        manifest: CFG_DAO_MANIFEST_TEXT,
        sender: sender,
        contractCaller: contract-caller,
        txSender: tx-sender
      }
    })
    (ok true)
  )
)
`;

export const tokenOwnerTemplate = `
;; title: aibtc-token-owner
;; version: 1.0.0
;; summary: An extension that provides management functions for the dao token

;; traits
;;

;; /g/.aibtc-dao-traits.extension/dao_extension_trait
(impl-trait .aibtc-dao-traits.extension)
;; /g/.aibtc-dao-traits.token-owner/dao_token_owner_trait
(impl-trait .aibtc-dao-traits.token-owner)

;; constants
;;

(define-constant ERR_NOT_DAO_OR_EXTENSION (err u1800))

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (set-token-uri (value (string-utf8 256)))
  (begin
    ;; check if caller is authorized
    (try! (is-dao-or-extension))
    ;; update token uri
    ;; /g/.aibtc-faktory/dao_token_contract
    (try! (as-contract (contract-call? .aibtc-faktory set-token-uri value)))
    ;; print event
    (print {
      ;; /g/aibtc/dao_token_symbol
      notification: "aibtc-token-owner/set-token-uri",
      payload: {
        contractCaller: contract-caller,
        txSender: tx-sender,
        value: value
      }
    })
    (ok true)
  )
)

;; keeping old format for trait adherance
(define-public (transfer-ownership (new-owner principal))
  (begin
    ;; check if caller is authorized
    (try! (is-dao-or-extension))
    ;; transfer ownership
    ;; /g/.aibtc-faktory/dao_token_contract
    (try! (as-contract (contract-call? .aibtc-faktory set-contract-owner new-owner)))
    ;; print event
    (print {
      ;; /g/aibtc/dao_token_symbol
      notification: "aibtc-token-owner/transfer-ownership",
      payload: {
        contractCaller: contract-caller,
        txSender: tx-sender,
        newOwner: new-owner
      }
    })
    (ok true)
  )
)

;; private functions
;;

(define-private (is-dao-or-extension)
  ;; /g/.aibtc-base-dao/dao_base_contract
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    ;; /g/.aibtc-base-dao/dao_base_contract
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)
`;
