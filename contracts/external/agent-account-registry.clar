;;;;;; NOTE: Let's call it the "Agent Account Registry" and agent-account-registry.clar
;;;;;; That way it's clear what it is and someone could deploy and use their own version too.
;;;;;; I like the title, version, summary format we have but am open to what works best there.
;; Simplified AI Account Registry Contract
;; Self-registration with attestation levels

;;;;;; NOTE: same here I'd call this agent-account
(use-trait ai-account .aibtc-agent-account-traits.aibtc-account-config)

;; Constants
;;;;;; NOTE: couldn't this be tx-sender or does it need to be hardcoded?
(define-constant ATTESTOR_DEPLOYER 'ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD) 
;;;;;; NOTE: confirming this will be your version, you're doing the attestation solo?
(define-constant ATTESTOR 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2)  
;;;;;; NOTE: alternate approach is to use a list of attestors, read-only in its section
;;;;;; Then we can provide a backup one that we're not using yet but have a separate wallet for.
(define-constant ATTESTORS
  (list 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2
        'ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD)
)

;; Errors
(define-constant ERR_NOT_CONTRACT_CALL (err u801))
(define-constant ERR_NOT_AUTHORIZED_DEPLOYER (err u802))
(define-constant ERR_ALREADY_REGISTERED (err u803))
(define-constant ERR_NOT_ATTESTOR (err u804))
(define-constant ERR_GET_CONFIG_FAILED (err u805))
(define-constant ERR_ACCOUNT_NOT_FOUND (err u806))

;; Maps

;;;;;; NOTE: same here with naming, agent-account-registry
;; Core registry: ai-account -> {owner, agent, attestation-level}
(define-map ai-account-registry
  principal 
  {
    owner: principal,
    agent: principal,
    ;;;;; NOTE: should we document max-attestation-level?
    attestation-level: uint 
  }
)

;;;;; NOTE: same here be explicit, owner-to-agent-account
;; Reverse lookup: owner -> ai-account
(define-map owner-to-account principal principal)

;; Track attestations 
;;;;; NOTE: and here agent-account-attestations
(define-map account-attestations
  ;;;;; NOTE: shorthand here looks good
  { account: principal, attestor: principal }
  bool
)

;; Auto-register (called from AI account with as-contract)
(define-public (auto-register-ai-account (owner principal) (agent principal))
  (begin  
    ;;;;; NOTE: need to verify this with our contract, isn't tx-sender agent account?
    (asserts! (is-eq tx-sender ATTESTOR_DEPLOYER) ERR_NOT_AUTHORIZED_DEPLOYER)
    ;;;;; NOTE: we can skip the checks here and assert on the map-insert which returns false if it exists
    (asserts! (is-none (map-get? ai-account-registry contract-caller)) ERR_ALREADY_REGISTERED) ;; Prevent double registration
    (asserts! (is-none (map-get? owner-to-account owner)) ERR_ALREADY_REGISTERED)
    (do-register-account contract-caller owner agent)
  )
)

(define-public (register-ai-account (account <ai-account>))
  (let (
    (ai-account-address (contract-of account))
    (ai-config (unwrap! (contract-call? account get-config) ERR_GET_CONFIG_FAILED))
    (owner (get owner ai-config))
    (agent (get agent ai-config))
  )
    (asserts! (is-eq tx-sender ATTESTOR_DEPLOYER) ERR_NOT_AUTHORIZED_DEPLOYER)
    ;;;;; NOTE: we can skip the checks here and assert on the map-insert which returns false if it exists
    (asserts! (is-none (map-get? ai-account-registry ai-account-address)) ERR_ALREADY_REGISTERED) ;; Prevent double registration
    (asserts! (is-none (map-get? owner-to-account owner)) ERR_ALREADY_REGISTERED)
    (do-register-account ai-account-address owner agent)
  )
)

(define-private (do-register-account (account principal) (owner principal) (agent principal))
  (begin
    ;;;;; NOTE: use the asserts on map-insert to catch the fail instead of leaving it silent. then we don't need the checks from earlier.
    ;;;;; NOTE: also another spot for agent-account
    (map-insert ai-account-registry account {
      owner: owner,
      agent: agent,
      attestation-level: u1
    })
    (map-insert owner-to-account owner account)
    ;;;;; NOTE: can we use SIP-019 formatting here? notification/data object format
    ;;;;; NOTE: also another spot for agent-account
    (print {
      type: "ai-account-registered",
      account: account,
      owner: owner,
      agent: agent,
      attestation-level: u1
    })
    (ok account)
  )
)

;; ---- Attestation Functions ----
;;;;; NOTE: attest-agent-account
(define-public (attest-account (account principal))
  (let ((registry-entry (unwrap! (map-get? ai-account-registry account) ERR_ACCOUNT_NOT_FOUND))
    (current-level (get attestation-level registry-entry))
    (new-level (+ current-level u1)))
    ;;;;; NOTE: tx-sender or contract-caller here?
    (asserts! (is-attestor tx-sender) ERR_NOT_ATTESTOR)
    ;;;;; NOTE: can skip and assert the map-insert which returns false if it exists
    ;;;;; NOTE: agent-account-attestations
    (asserts! (is-none (map-get? account-attestations { account: account, attestor: tx-sender })) ERR_ALREADY_REGISTERED)
    (map-insert account-attestations { account: account, attestor: tx-sender } true)
    (map-set ai-account-registry account (merge registry-entry { attestation-level: new-level }))   
      (print {
        type: "account-attested",
        account: account,
        attestor: tx-sender,
        new-attestation-level: new-level,
        ;;;;; NOTE: one spot we could add a max-attestation-level
        max-attestation-level: (len ATTESTORS)
      })
      (ok new-level) 
  )
)

;; ---- Read ----
;;;;; NOTE: would add something to get the contract config
(define-read-only (get-registry-config)
  {
    attestor-deployer: ATTESTOR_DEPLOYER,
    attestors: ATTESTORS,
    max-attestation-level: (len ATTESTORS)
  }
)

;;;;; NOTE: agent-agent-account-by-owner
;;;;; NOTE: should we have a map for get-agent-account-by-agent too?
(define-read-only (get-ai-account-by-owner (owner principal))
  (map-get? owner-to-account owner)
)

;;;;; NOTE: get-agent-account-info
(define-read-only (get-account-info (account principal))
  (map-get? ai-account-registry account)
)

(define-read-only (get-attestation-level (account principal))
  (match (map-get? ai-account-registry account)
    registry-entry (some (get attestation-level registry-entry))
    none
  )
)

(define-read-only (is-account-attested (account principal) (min-level uint))
  (match (get-attestation-level account)
    level (>= level min-level)
    false
  )
)

;; ---- Helper Functions ----
(define-read-only (is-attestor (who principal))
  (is-eq who ATTESTOR)
)

;;;;;; NOTE: helper to check if a principal is on the list of ATTESTORS
(define-read-only (is-attestor-from-list (who principal))
  (ok (asserts! (is-some (index-of? ATTESTORS who)) ERR_NOT_ATTESTOR))
)

(define-read-only (has-attestor-signed (account principal) (attestor principal))
  (default-to false (map-get? account-attestations { account: account, attestor: attestor }))
)

;; Get all attestors who have signed for an account
;;;;; NOTE: could do some list iteration here for a specific agent account
(define-read-only (get-account-attestors (account principal))
  {
    attestor-signed: (has-attestor-signed account ATTESTOR)
  }
)

;;;;; NOTE: overall feedback, use the term "agent-account" consistently and focus on clear names for functions and shorter names inside that are easy to think of and interpret.
