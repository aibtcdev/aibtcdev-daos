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
        {
          extension: .aibtc-action-proposal-voting,
          enabled: true,
        }
        ;; /g/.aibtc-dao-charter/dao_charter_contract
        {
          extension: .aibtc-dao-charter,
          enabled: true,
        }
        ;; /g/.aibtc-dao-epoch/dao_epoch_contract
        {
          extension: .aibtc-dao-epoch,
          enabled: true,
        }
        ;; /g/.aibtc-dao-users/dao_users_contract
        {
          extension: .aibtc-dao-users,
          enabled: true,
        }
        ;; /g/.aibtc-onchain-messaging/dao_messaging_contract
        {
          extension: .aibtc-onchain-messaging,
          enabled: true,
        }
        ;; /g/.aibtc-token-owner/dao_token_owner_contract
        {
          extension: .aibtc-token-owner,
          enabled: true,
        }
        ;; /g/.aibtc-treasury/dao_treasury_contract
        {
          extension: .aibtc-treasury,
          enabled: true,
        }
        ;; initial action proposals (as extensions)
        ;; /g/.aibtc-action-send-message/dao_action_send_message_contract
        {
          extension: .aibtc-action-send-message,
          enabled: true,
        }
      )))
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
        txSender: tx-sender,
      },
    })
    (ok true)
  )
)
