;; title: aibtc-rewards-account
;; version: 1.0.0
;; summary: A smart contract that accrues rewards from the treasury and pays out after successful proposals.

;; traits
;;

(impl-trait .aibtc-dao-traits.extension)
;; (impl-trait .aibtc-dao-traits.rewards-account)

(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; constants
;;

;; error messages
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u10000))
(define-constant ERR_UNKNOWN_ASSET (err u10001))
(define-constant ERR_FETCHING_ASSET (err u10002))

;; contract details
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; track epochs by BTC block height
(define-constant EPOCH_BPS u5000) ;; 50% of own supply
(define-constant EPOCH_BPS_DIVISOR u10000) ;; 10000 BP = 100%

;; template variables
;;
;; /g/find/replace

;; data maps
;;

;; track transfers per period
;; TODO - track amount instead of bool?
(define-map StxClaims
  uint ;; period
  uint ;; claimed amount
)
(define-map FtClaims
  { contract: principal, period: uint }
  uint ;; claimed amount
)

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

;; read only functions
;;

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)
