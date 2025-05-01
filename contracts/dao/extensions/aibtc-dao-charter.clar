;; title: aibtc-dao-charter
;; version: 1.0.0
;; summary: An extension that manages the DAO charter and records the DAO's mission and values on-chain.

;; traits
;;

;; /g/.aibtc-dao-traits.extension/dao_extension_trait
(impl-trait .aibtc-dao-traits.extension)
;; /g/.aibtc-dao-traits.charter/dao_charter_trait
(impl-trait .aibtc-dao-traits.dao-charter)

;; constants
;;

;; contract details
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; error codes
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u1400))
(define-constant ERR_SAVING_CHARTER (err u1401))
(define-constant ERR_CHARTER_TOO_SHORT (err u1402))
(define-constant ERR_CHARTER_TOO_LONG (err u1403))

;; data vars
;;

(define-data-var daoCharter (string-ascii 4096) "")
(define-data-var currentVersion uint u0)

;; data maps
;;

(define-map CharterVersions
  uint ;; version number
  {
    burnHeight: uint, ;; burn block height
    createdAt: uint, ;; block height
    caller: principal, ;; contract caller
    sender: principal, ;; tx-sender
    charter: (string-ascii 4096), ;; charter text
  }
)

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (set-dao-charter (charter (string-ascii 4096)))
  (let
    (
      (newVersion (+ (var-get currentVersion) u1))
    )
    ;; check if sender is dao or extension
    (try! (is-dao-or-extension))
    ;; check length of charter
    (asserts! (>= (len charter) u1) ERR_CHARTER_TOO_SHORT)
    (asserts! (<= (len charter) u4096) ERR_CHARTER_TOO_LONG)
    ;; insert new charter version
    (asserts! (map-insert CharterVersions newVersion {
      burnHeight: burn-block-height,
      createdAt: stacks-block-height,
      caller: contract-caller,
      sender: tx-sender,
      charter: charter,
    }) ERR_SAVING_CHARTER)
    ;; print charter info
    (print {
      ;; /g/aibtc/dao_token_symbol
      notification: "aibtc-dao-charter/set-dao-charter",
      payload: {
        burnHeight: burn-block-height,
        createdAt: stacks-block-height,
        contractCaller: contract-caller,
        txSender: tx-sender,
        dao: SELF,
        charter: charter,
        previousCharter: (var-get daoCharter),
        version: newVersion
      }
    })
    ;; increment charter version
    (var-set currentVersion newVersion)
    ;; set new charter
    (var-set daoCharter charter)
    ;; return success
    (ok true)
  )
)

;; read only functions
;;
(define-read-only (get-current-dao-charter-version)
  (if (> (var-get currentVersion) u0)
    (some (var-get currentVersion))
    none
  )
)

(define-read-only (get-current-dao-charter)
  (if (> (var-get currentVersion) u0)
    (some (var-get daoCharter))
    none
  )
)

(define-read-only (get-dao-charter (version uint))
  (map-get? CharterVersions version)
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
