;; title: aibtc-dao-charter
;; version: 2.0.0
;; summary: An extension that allows a monarch to manage the DAO charter and records the DAO's mission and values on-chain.

;; traits
;;

;; /g/.aibtc-dao-traits.extension/dao_trait_extension
(impl-trait .aibtc-dao-traits.extension)
;; /g/.aibtc-dao-traits.dao-charter/dao_trait_charter
(impl-trait .aibtc-dao-traits.dao-charter)

;; constants
;;

;; contract details
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; error codes
(define-constant ERR_NOT_AUTHORIZED (err u1400))
(define-constant ERR_SAVING_CHARTER (err u1401))
(define-constant ERR_CHARTER_TOO_SHORT (err u1402))
(define-constant ERR_CHARTER_TOO_LONG (err u1403))
(define-constant ERR_SAVING_MONARCH (err u1404))

;; data vars
;;

(define-data-var currentCharterIndex uint u0)
(define-data-var currentMonarchIndex uint u0)

;; data maps
;;

(define-map Charters
  uint ;; version number
  {
    burnHeight: uint, ;; burn block height
    createdAt: uint, ;; block height
    caller: principal, ;; contract caller
    sender: principal, ;; tx-sender
    charter: (string-utf8 16384), ;; charter text
  }
)

(define-map Monarchs
  uint ;; version number
  {
    burnHeight: uint, ;; burn block height
    createdAt: uint, ;; block height
    caller: principal, ;; contract caller
    sender: principal, ;; tx-sender
    previousMonarch: principal, ;; previous monarch
    newMonarch: principal, ;; new monarch
  }
)

;; public functions
;;

(define-public (callback
    (sender principal)
    (memo (buff 34))
  )
  (ok true)
)

(define-public (set-dao-charter (charter (string-utf8 16384)))
  (let (
      (newVersion (+ (var-get currentCharterIndex) u1))
      (previousCharter (match (map-get? Charters (var-get currentCharterIndex))
        cv (get charter cv)
        u""
      ))
    )
    ;; check if sender is dao, extension, or monarch
    (asserts! (or (is-dao-or-extension) (is-monarch)) ERR_NOT_AUTHORIZED)
    ;; check length of charter
    (asserts! (>= (len charter) u1) ERR_CHARTER_TOO_SHORT)
    (asserts! (<= (len charter) u16384) ERR_CHARTER_TOO_LONG)
    ;; insert new charter version
    (asserts!
      (map-insert Charters newVersion {
        burnHeight: burn-block-height,
        createdAt: stacks-block-height,
        caller: contract-caller,
        sender: tx-sender,
        charter: charter,
      })
      ERR_SAVING_CHARTER
    )
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
        previousCharter: previousCharter,
        version: newVersion,
      },
    })
    ;; increment charter version
    (var-set currentCharterIndex newVersion)
    ;; return success
    (ok true)
  )
)

(define-public (set-dao-monarch (newMonarch principal))
  (let (
      (newIndex (+ (var-get currentMonarchIndex) u1))
      ;; default to tx-sender if no previous monarch (i.e. first monarch)
      (previousMonarch (match (map-get? Monarchs (var-get currentMonarchIndex))
        mv (get previousMonarch mv)
        tx-sender
      ))
    )
    ;; check if sender is dao, extension, or monarch
    (asserts! (or (is-dao-or-extension) (is-monarch)) ERR_NOT_AUTHORIZED)
    ;; insert monarch history
    (asserts!
      (map-insert Monarchs newIndex {
        burnHeight: burn-block-height,
        createdAt: stacks-block-height,
        caller: contract-caller,
        sender: tx-sender,
        previousMonarch: previousMonarch,
        newMonarch: newMonarch,
      })
      ERR_SAVING_MONARCH
    )
    ;; print monarch change info
    (print {
      ;; /g/aibtc/dao_token_symbol
      notification: "aibtc-dao-charter/set-dao-monarch",
      payload: {
        burnHeight: burn-block-height,
        createdAt: stacks-block-height,
        contractCaller: contract-caller,
        txSender: tx-sender,
        dao: SELF,
        previousMonarch: previousMonarch,
        newMonarch: newMonarch,
        index: newIndex,
      },
    })
    ;; increment monarch index
    (var-set currentMonarchIndex newIndex)
    ;; return success
    (ok true)
  )
)

;; read only functions
;;
(define-read-only (get-current-dao-charter-index)
  (if (> (var-get currentCharterIndex) u0)
    (some (var-get currentCharterIndex))
    none
  )
)

(define-read-only (get-current-dao-charter)
  (map-get? Charters (var-get currentCharterIndex))
)

(define-read-only (get-dao-charter (version uint))
  (map-get? Charters version)
)

(define-read-only (get-current-dao-monarch-index)
  (if (> (var-get currentMonarchIndex) u0)
    (some (var-get currentMonarchIndex))
    none
  )
)

(define-read-only (get-current-dao-monarch)
  (map-get? Monarchs (var-get currentMonarchIndex))
)

(define-read-only (get-dao-monarch (index uint))
  (map-get? Monarchs index)
)

;; private functions
;;

;; auth functions simplified to bool outputs so that we can check
;; both versus just is-dao-or-extension like other contracts

(define-private (is-dao-or-extension)
  (or
    ;; /g/.aibtc-base-dao/dao_contract_base
    (is-eq tx-sender .aibtc-base-dao)
    ;; /g/.aibtc-base-dao/dao_contract_base
    (contract-call? .aibtc-base-dao is-extension contract-caller)
  )
)

(define-private (is-monarch)
  (let ((currentMonarch (map-get? Monarchs (var-get currentMonarchIndex))))
    (and (is-some currentMonarch) (is-eq tx-sender (get newMonarch (unwrap-panic currentMonarch))))
  )
)
