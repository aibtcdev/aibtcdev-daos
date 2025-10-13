;; title: aibtc-base-initialize-dao
;; version: 1.0.0
;; summary: A proposal that sets up the initial DAO configuration and extensions.

;; /g/.aibtc-dao-traits.proposal/dao_trait_proposal
(impl-trait .aibtc-dao-traits.proposal)

;; /g/Test/dao_manifest
(define-constant CFG_DAO_MANIFEST_TEXT u"Test")
;; /g/'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/dao_monarch
(define-constant CFG_DAO_MONARCH 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
;; /g/.aibtc-faktory/dao_contract_token
(define-constant CFG_DAO_TOKEN .aibtc-faktory)
;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/sbtc_token_contract
(define-constant CFG_SBTC_TOKEN 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token)

(define-public (execute (sender principal))
  (begin
    ;; set initial dao extensions list
    ;; /g/.aibtc-base-dao/dao_contract_base
    (try! (contract-call? .aibtc-base-dao set-extensions
      (list
        ;; initial DAO extensions (features)
        {
          ;; /g/.aibtc-action-proposal-voting/dao_contract_action_proposal_voting
          extension: .aibtc-action-proposal-voting,
          enabled: true,
        }
        {
          ;; /g/.aibtc-dao-charter/dao_contract_charter
          extension: .aibtc-dao-charter,
          enabled: true,
        }
        {
          ;; /g/.aibtc-dao-epoch/dao_contract_epoch
          extension: .aibtc-dao-epoch,
          enabled: true,
        }
        {
          ;; /g/.aibtc-onchain-messaging/dao_contract_messaging
          extension: .aibtc-onchain-messaging,
          enabled: true,
        }
        {
          ;; /g/.aibtc-token-owner/dao_contract_token_owner
          extension: .aibtc-token-owner,
          enabled: true,
        }
        {
          ;; /g/.aibtc-treasury/dao_contract_treasury
          extension: .aibtc-treasury,
          enabled: true,
        }
        ;; initial action proposals (as extensions)
        {
          ;; /g/.aibtc-action-send-message/dao_action_send_message
          extension: .aibtc-action-send-message,
          enabled: true,
        }
      )))
    ;; allow default assets in treasury
    ;; /g/.aibtc-treasury/dao_contract_treasury
    (try! (contract-call? .aibtc-treasury allow-asset CFG_DAO_TOKEN true))
    ;; /g/.aibtc-treasury/dao_contract_treasury
    (try! (contract-call? .aibtc-treasury allow-asset CFG_SBTC_TOKEN true))
    ;; set DAO manifest in dao-charter extension
    ;; /g/.aibtc-dao-charter/dao_contract_charter
    (try! (contract-call? .aibtc-dao-charter set-dao-charter CFG_DAO_MANIFEST_TEXT))
    ;; /g/.aibtc-dao-charter/dao_contract_charter
    (try! (contract-call? .aibtc-dao-charter set-dao-monarch CFG_DAO_MONARCH))
    ;; print initialization data
    (print {
      ;; /g/aibtc/dao_token_symbol
      notification: "aibtc-base-initialize-dao/execute",
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
