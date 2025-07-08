;; 99af7ff63e5e4bd7542e55d88bacc25a7a6f79004f9937ea0bab3ca4c2438061
;; aibtc.dev DAO faktory.fun DEX @version 1.0

;; /g/.aibtc-dao-traits.faktory-dex/dao_trait_faktory_dex
(impl-trait .aibtc-dao-traits.faktory-dex)

;; /g/'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-dex-trait-v1-1.dex-trait/faktory_dex_trait
(impl-trait 'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-dex-trait-v1-1.dex-trait)
;; /g/'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-trait-v1.sip-010-trait/dao_trait_faktory_sip010
(use-trait faktory-token 'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-trait-v1.sip-010-trait)

(define-constant ERR-MARKET-CLOSED (err u1001))
(define-constant ERR-STX-NON-POSITIVE (err u1002))
(define-constant ERR-STX-BALANCE-TOO-LOW (err u1003))
(define-constant ERR-FT-NON-POSITIVE (err u1004))
(define-constant ERR-FETCHING-BUY-INFO (err u1005))
(define-constant ERR-FETCHING-SELL-INFO (err u1006))
(define-constant ERR-AMOUNT-TOO-HIGH (err u1007))
(define-constant ERR-AMOUNT-TOO-LOW (err u1008))
(define-constant ERR-TOKEN-NOT-AUTH (err u401))

(define-constant FEE-RECEIVER 'ST3S2565C4DP2MGR3CMANMGYDCDA314Q25AQGR26R) ;; 'SMHAVPYZ8BVD0BHBBQGY5AQVVGNQY4TNHAKGPYP)
(define-constant G-RECEIVER 'ST3CZY55VJE5P5DJAP5E58X123BZKMYDCNEZMRTV2) ;; 'SM3NY5HXXRNCHS1B65R78CYAC1TQ6DEMN3C0DN74S)

(define-constant FAKTORY 'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A)
;; /g/'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A/origin_address
(define-constant ORIGINATOR 'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A)
;; /g/.aibtc-faktory/dao_contract_token
(define-constant DEX-TOKEN .aibtc-faktory) ;; SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22

;; token constants
(define-constant TARGET_STX u5000000)
(define-constant FAK_STX u1000000)
(define-constant GRAD-FEE u100000)
(define-constant DEX-AMOUNT u250000)

;; data vars
(define-data-var open bool false)
(define-data-var bonded bool false)
(define-data-var fak-ustx uint u0)
(define-data-var ft-balance uint u0)
(define-data-var stx-balance uint u0)
(define-data-var premium uint u25)

(define-public (buy
    (ft <faktory-token>)
    (ubtc uint)
  )
  (begin
    (and (not (var-get open)) (try! (open-market)))
    (asserts! (is-eq DEX-TOKEN (contract-of ft)) ERR-TOKEN-NOT-AUTH)
    (asserts! (var-get open) ERR-MARKET-CLOSED)
    (asserts! (>= ubtc u4) ERR-STX-NON-POSITIVE)
    (let (
        (in-info (unwrap! (get-in ubtc) ERR-FETCHING-BUY-INFO))
        (total-stx (get total-stx in-info))
        (total-stk (get total-stk in-info))
        (total-ft (get ft-balance in-info))
        (k (get k in-info))
        (fee (get fee in-info))
        (pre-fee (/ (* fee u40) u100))
        (stx-in (get stx-in in-info))
        (new-stk (get new-stk in-info))
        (new-ft (get new-ft in-info))
        (tokens-out (get tokens-out in-info))
        (new-stx (get new-stx in-info))
        (ft-receiver tx-sender)
        (stx-max (/ (* (get stx-to-grad in-info) u115) u100))
      )
      (asserts! (<= ubtc stx-max) ERR-AMOUNT-TOO-HIGH)
      ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
      (try! (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token
        transfer (- fee pre-fee) tx-sender FEE-RECEIVER none
      ))
      ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
      (try! (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token
        ;; /g/.aibtc-pre-faktory/dao_contract_token_prelaunch
        transfer pre-fee tx-sender .aibtc-pre-faktory none
      ))
      ;; /g/.aibtc-pre-faktory/dao_contract_token_prelaunch
      (try! (as-contract (contract-call? .aibtc-pre-faktory create-fees-receipt pre-fee)))
      ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
      (try! (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token
        transfer stx-in tx-sender (as-contract tx-sender) none
      ))
      (try! (as-contract (contract-call? ft transfer tokens-out tx-sender ft-receiver none)))
      (if (>= new-stx TARGET_STX)
        (let (
            (premium-amount (/ (* new-ft (var-get premium)) u100))
            (amm-amount (- new-ft premium-amount))
            (agent-amount (/ (* premium-amount u60) u100))
            (originator-amount (- premium-amount agent-amount))
            (amm-ustx (- new-stx GRAD-FEE))
            (xyk-pool-uri (default-to u"https://faktory.fun/"
              (try! (contract-call? ft get-token-uri))
            ))
            (xyk-burn-amount (- (sqrti (* amm-ustx amm-amount)) u1))
          )
          (try! (as-contract (contract-call? ft transfer agent-amount tx-sender FAKTORY none)))
          (try! (as-contract (contract-call? ft transfer originator-amount tx-sender ORIGINATOR none)))
          ;; Call XYK Core v-1-2 pool by Bitflow
          (try! (as-contract (contract-call?
            ;; /g/'ST295MNE41DC74QYCPRS8N37YYMC06N6Q3VQDZ6G1.xyk-core-v-1-2/external_bitflow_core
            'ST295MNE41DC74QYCPRS8N37YYMC06N6Q3VQDZ6G1.xyk-core-v-1-2
            ;; /g/.xyk-pool-sbtc-aibtc-v-1-1/dao_contract_token_pool
            create-pool .xyk-pool-sbtc-aibtc-v-1-1
            ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
            'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token ft amm-ustx
            amm-amount xyk-burn-amount u10 u40 u10 u40
            'ST27Q7Z7P5MTJN2B3M9Q406XPCDB1VFZJ3KWX3CES xyk-pool-uri true
          )))
          ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
          (try! (as-contract (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token
            transfer GRAD-FEE tx-sender G-RECEIVER none
          )))
          (var-set open false)
          (var-set bonded true)
          (var-set stx-balance u0)
          (var-set ft-balance u0)
          ;; /g/.aibtc-pre-faktory/dao_contract_token_prelaunch
          (try! (as-contract (contract-call? .aibtc-pre-faktory toggle-bonded)))
          (print {
            type: "buy",
            ft: (contract-of ft),
            tokens-out: tokens-out,
            ustx: ubtc,
            premium-amount: premium-amount,
            amm-amount: amm-amount,
            amm-ustx: amm-ustx,
            stx-balance: u0,
            ft-balance: u0,
            fee: fee,
            grad-fee: GRAD-FEE,
            maker: tx-sender,
            open: false,
          })
          (ok true)
        )
        (begin
          (var-set stx-balance new-stx)
          (var-set ft-balance new-ft)
          (print {
            type: "buy",
            ft: (contract-of ft),
            tokens-out: tokens-out,
            ustx: ubtc,
            maker: tx-sender,
            stx-balance: new-stx,
            ft-balance: new-ft,
            fee: fee,
            open: true,
          })
          (ok true)
        )
      )
    )
  )
)

(define-read-only (get-in (ubtc uint))
  (let (
      (total-stx (var-get stx-balance))
      (total-stk (+ total-stx (var-get fak-ustx)))
      (total-ft (var-get ft-balance))
      (k (* total-ft total-stk))
      (feek (/ (* ubtc u2) u100))
      (fee (if (>= feek u3)
        feek
        u3
      ))
      (stx-in (if (> ubtc fee)
        (- ubtc fee)
        u0
      ))
      (new-stk (+ total-stk stx-in))
      (new-ft (/ k new-stk))
      (tokens-out (- total-ft new-ft))
      (raw-to-grad (- TARGET_STX total-stx))
      (stx-to-grad (/ (* raw-to-grad u103) u100))
    )
    (ok {
      total-stx: total-stx,
      total-stk: total-stk,
      ft-balance: total-ft,
      k: k,
      fee: fee,
      stx-in: stx-in,
      new-stk: new-stk,
      new-ft: new-ft,
      tokens-out: tokens-out,
      new-stx: (+ total-stx stx-in),
      stx-to-grad: stx-to-grad,
    })
  )
)

(define-public (sell
    (ft <faktory-token>)
    (amount uint)
  )
  (begin
    (asserts! (is-eq DEX-TOKEN (contract-of ft)) ERR-TOKEN-NOT-AUTH)
    (asserts! (var-get open) ERR-MARKET-CLOSED)
    (asserts! (> amount u0) ERR-FT-NON-POSITIVE)
    (let (
        (out-info (unwrap! (get-out amount) ERR-FETCHING-SELL-INFO))
        (total-stx (get total-stx out-info))
        (total-stk (get total-stk out-info))
        (total-ft (get ft-balance out-info))
        (k (get k out-info))
        (new-ft (get new-ft out-info))
        (new-stk (get new-stk out-info))
        (stx-out (get stx-out out-info))
        (fee (get fee out-info))
        (pre-fee (/ (* fee u40) u100))
        (stx-to-receiver (get stx-to-receiver out-info))
        (new-stx (get new-stx out-info))
        (stx-receiver tx-sender)
      )
      (asserts! (>= stx-out u4) ERR-AMOUNT-TOO-LOW)
      (asserts! (>= total-stx stx-out) ERR-STX-BALANCE-TOO-LOW)
      (try! (contract-call? ft transfer amount tx-sender (as-contract tx-sender) none))
      ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
      (try! (as-contract (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token
        transfer stx-to-receiver tx-sender stx-receiver none
      )))
      ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
      (try! (as-contract (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token
        transfer (- fee pre-fee) tx-sender FEE-RECEIVER none
      )))
      ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
      (try! (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token
        ;; /g/.aibtc-pre-faktory/dao_contract_token_prelaunch
        transfer pre-fee tx-sender .aibtc-pre-faktory none
      ))
      ;; /g/.aibtc-pre-faktory/dao_contract_token_prelaunch
      (try! (as-contract (contract-call? .aibtc-pre-faktory create-fees-receipt pre-fee)))
      (var-set stx-balance new-stx)
      (var-set ft-balance new-ft)
      (print {
        type: "sell",
        ft: (contract-of ft),
        amount: amount,
        stx-to-receiver: stx-to-receiver,
        maker: tx-sender,
        stx-balance: new-stx,
        ft-balance: new-ft,
        fee: fee,
        open: true,
      })
      (ok true)
    )
  )
)

(define-read-only (get-out (amount uint))
  (let (
      (total-stx (var-get stx-balance))
      (total-stk (+ total-stx (var-get fak-ustx)))
      (total-ft (var-get ft-balance))
      (k (* total-ft total-stk))
      (new-ft (+ total-ft amount))
      (new-stk (/ k new-ft))
      (stx-out (if (>= total-stk (+ new-stk u5))
        (- (- total-stk new-stk) u1)
        u0
      ))
      (feek (/ (* stx-out u2) u100))
      (fee (if (>= feek u3)
        feek
        u3
      ))
      (stx-to-receiver (if (> stx-out fee)
        (- stx-out fee)
        u0
      ))
    )
    (ok {
      total-stx: total-stx,
      total-stk: total-stk,
      ft-balance: total-ft,
      k: k,
      new-ft: new-ft,
      new-stk: new-stk,
      stx-out: stx-out,
      fee: fee,
      stx-to-receiver: stx-to-receiver,
      amount-in: amount,
      new-stx: (- total-stx stx-out),
    })
  )
)

(define-read-only (get-open)
  (ok (var-get open))
)

(define-public (open-market)
  ;; /g/.aibtc-pre-faktory/dao_contract_token_prelaunch
  (let ((is-prelaunch-allowing (unwrap-panic (contract-call? .aibtc-pre-faktory is-market-open))))
    (asserts! (not (var-get bonded)) ERR-MARKET-CLOSED)
    (asserts! is-prelaunch-allowing ERR-MARKET-CLOSED)
    (var-set open true)
    (ok true)
  )
)

;; boot dex
(begin
  (var-set fak-ustx FAK_STX)
  (var-set stx-balance DEX-AMOUNT)
  (var-set ft-balance u16000000000000000)
  (print {
    type: "faktory-dex-trait-v1-1",
    dexContract: (as-contract tx-sender),
    ;; /g/'ST295MNE41DC74QYCPRS8N37YYMC06N6Q3VQDZ6G1.xyk-core-v-1-2/external_bitflow_core
    ammReceiver: 'ST295MNE41DC74QYCPRS8N37YYMC06N6Q3VQDZ6G1.xyk-core-v-1-2,
    ;; /g/.xyk-pool-sbtc-aibtc-v-1-1/dao_contract_token_pool
    poolName: .xyk-pool-sbtc-aibtc-v-1-1,
  })
  (ok true)
)
