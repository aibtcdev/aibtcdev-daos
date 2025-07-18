;; 99af7ff63e5e4bd7542e55d88bacc25a7a6f79004f9937ea0bab3ca4c2438061
;; AIBTC Powered By Faktory.fun v1.0 

(impl-trait 'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-trait-v1.sip-010-trait) ;; 'SP3XXMS38VTAWTVPE5682XSBFXPTH7XCPEBTX8AN2
(impl-trait .aibtc-dao-traits.token) ;; 'SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC

(define-constant ERR-NOT-AUTHORIZED u401)
(define-constant ERR-NOT-OWNER u402)

;; /g/SYMBOL/dao_token_symbol
(define-fungible-token SYMBOL-AIBTC-DAO MAX)
(define-constant MAX u100000000000000000)
;; /g/.aibtc-token-owner/dao_contract_token_owner
(define-data-var contract-owner principal .aibtc-token-owner)
;; /g/link to json for token metadata/dao_token_metadata
(define-data-var token-uri (optional (string-utf8 256)) (some u"link to json for token metadata"))

;; SIP-10 Functions
(define-public (transfer
    (amount uint)
    (sender principal)
    (recipient principal)
    (memo (optional (buff 34)))
  )
  (begin
    (asserts! (is-eq tx-sender sender) (err ERR-NOT-AUTHORIZED))
    ;; /g/SYMBOL/dao_token_symbol
    (match (ft-transfer? SYMBOL-AIBTC-DAO amount sender recipient)
      response (begin
        (print memo)
        (ok response)
      )
      error (err error)
    )
  )
)

(define-public (set-token-uri (value (string-utf8 256)))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-NOT-AUTHORIZED))
    (var-set token-uri (some value))
    (ok (print {
      notification: "token-metadata-update",
      payload: {
        contract-id: (as-contract tx-sender),
        token-class: "ft",
      },
    }))
  )
)

(define-read-only (get-balance (account principal))
  ;; /g/SYMBOL/dao_token_symbol
  (ok (ft-get-balance SYMBOL-AIBTC-DAO account))
)

(define-read-only (get-name)
  ;; /g/SYMBOL/dao_token_symbol
  (ok "SYMBOL-AIBTC-DAO")
)

(define-read-only (get-symbol)
  ;; /g/SYMBOL/dao_token_symbol
  (ok "SYMBOL-AIBTC-DAO")
)

(define-read-only (get-decimals)
  (ok u8)
)

(define-read-only (get-total-supply)
  ;; /g/SYMBOL/dao_token_symbol
  (ok (ft-get-supply SYMBOL-AIBTC-DAO))
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-NOT-AUTHORIZED))
    (print { new-owner: new-owner })
    (ok (var-set contract-owner new-owner))
  )
)

;; ---------------------------------------------------------

(define-public (send-many (recipients (list 200 {
  to: principal,
  amount: uint,
  memo: (optional (buff 34)),
})))
  (fold check-err (map send-token recipients) (ok true))
)

(define-private (check-err
    (result (response bool uint))
    (prior (response bool uint))
  )
  (match prior
    ok-value
    result
    err-value (err err-value)
  )
)

(define-private (send-token (recipient {
  to: principal,
  amount: uint,
  memo: (optional (buff 34)),
}))
  (send-token-with-memo (get amount recipient) (get to recipient)
    (get memo recipient)
  )
)

(define-private (send-token-with-memo
    (amount uint)
    (to principal)
    (memo (optional (buff 34)))
  )
  (let ((transferOk (try! (transfer amount tx-sender to memo))))
    (ok transferOk)
  )
)

;; ---------------------------------------------------------

(begin
  ;; ft distribution
  ;; /g/SYMBOL/dao_token_symbol
  ;; /g/.aibtc-treasury/dao_contract_treasury
  (try! (ft-mint? SYMBOL-AIBTC-DAO (/ (* MAX u80) u100) .aibtc-treasury)) ;; 80% treasury SPVMS254T8Q0RXQP95Y01T7KBHZV91X88CDK48QH
  ;; /g/SYMBOL/dao_token_symbol
  ;; /g/.aibtc-faktory-dex/dao_contract_faktory_dex
  (try! (ft-mint? SYMBOL-AIBTC-DAO (/ (* MAX u16) u100) .aibtc-faktory-dex)) ;; 16% dex SPVMS254T8Q0RXQP95Y01T7KBHZV91X88CDK48QH
  ;; /g/SYMBOL/dao_token_symbol
  ;; /g/.aibtc-pre-faktory/dao_contract_pre_faktory
  (try! (ft-mint? SYMBOL-AIBTC-DAO (/ (* MAX u4) u100) .aibtc-pre-faktory)) ;; 4% pre-launch SPVMS254T8Q0RXQP95Y01T7KBHZV91X88CDK48QH
  (print {
    type: "faktory-trait-v1",
    ;; /g/SYMBOL/dao_token_symbol
    name: "SYMBOL-AIBTC-DAO",
    ;; /g/SYMBOL/dao_token_symbol
    symbol: "SYMBOL-AIBTC-DAO",
    token-uri: u"link to json for token metadata",
    tokenContract: (as-contract tx-sender),
    supply: MAX,
    decimals: u8,
    targetStx: u5000000,
    tokenToDex: (/ (* MAX u16) u100),
    tokenToDeployer: (/ (* MAX u4) u100),
    stxToDex: u250000,
    stxBuyFirstFee: u150000,
  })
)
