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
