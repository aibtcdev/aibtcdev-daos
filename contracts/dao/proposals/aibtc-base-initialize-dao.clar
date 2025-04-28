(impl-trait .aibtc-dao-traits.proposal)

;; /g/dao mission goes here/dao_manifest
(define-constant CFG_DAO_MANIFEST_TEXT "dao mission goes here")
;; /g/.aibtc-token/dao_token_contract
(define-constant CFG_DAO_TOKEN .aibtc-token)

(define-public (execute (sender principal))
  (begin
    ;; set initial dao extensions list
    (try! (contract-call? .aibtc-base-dao set-extensions
      (list
        ;; initial DAO extensions (features)
        {extension: .aibtc-action-proposal-voting, enabled: true}
        {extension: .aibtc-dao-charter, enabled: true}
        {extension: .aibtc-dao-epoch, enabled: true}
        {extension: .aibtc-dao-users, enabled: true}
        {extension: .aibtc-onchain-messaging, enabled: true}
        {extension: .aibtc-token-owner, enabled: true}
        {extension: .aibtc-treasury, enabled: true}
        ;; initial action proposals (as extensions)
        {extension: .aibtc-action-send-message, enabled: true}
      )
    ))
    ;; allow asset in treasury
    (try! (contract-call? .aibtc-treasury allow-asset CFG_DAO_TOKEN true))
    ;; set DAO manifest in dao-charter extension
    (try! (contract-call? .aibtc-dao-charter set-dao-charter CFG_DAO_MANIFEST_TEXT))
    ;; send DAO manifest as onchain message
    (try! (contract-call? .aibtc-onchain-messaging send CFG_DAO_MANIFEST_TEXT true))
    ;; print manifest data
    (print {
      notification: "aibtc-base-dao/manifest",
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
