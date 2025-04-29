;; title: aibtc-action-send-message
;; version: 1.0.0
;; summary: A predefined action to send a message through the onchain messaging system.

;; traits
;;

;; /g/.aibtc-dao-traits.extension/dao_extension_trait
(impl-trait .aibtc-dao-traits.extension)
;; /g/.aibtc-dao-traits.action/dao_action_trait
(impl-trait .aibtc-dao-traits.action)

;; constants
;;

(define-constant ERR_NOT_DAO_OR_EXTENSION (err u1100))
(define-constant ERR_INVALID_PARAMS (err u1101))

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (run (parameters (buff 2048)))
  (let
    ((message (unwrap! (from-consensus-buff? (string-ascii 2043) parameters) ERR_INVALID_PARAMS)))
    (try! (is-dao-or-extension))
    ;; /g/.aibtc-onchain-messaging/dao_messaging_contract
    (contract-call? .aibtc-onchain-messaging send message)
  )
)

(define-public (check-parameters (parameters (buff 2048)))
  (let
    ((message (unwrap! (from-consensus-buff? (string-ascii 2043) parameters) ERR_INVALID_PARAMS)))
    ;; check there is a message
    (asserts! (> (len message) u0) ERR_INVALID_PARAMS)
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
