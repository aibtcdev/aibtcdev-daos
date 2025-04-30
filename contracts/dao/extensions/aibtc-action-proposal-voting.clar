;; title: aibtc-action-proposal-voting
;; version: 3.0.0
;; summary: An extension that manages voting on predefined actions using a SIP-010 Stacks token.

;; traits
;;

;; /g/.aibtc-dao-traits.extension/dao_extension_trait
(impl-trait .aibtc-dao-traits.extension)
;; /g/.aibtc-dao-traits.action/dao_action_proposals_voting_trait
(impl-trait .aibtc-dao-traits.action-proposals-voting)
;; /g/.aibtc-dao-traits.action/dao_action_trait
(use-trait action-trait .aibtc-dao-traits.action)

;; constants
;;

(define-constant SELF (as-contract tx-sender))
(define-constant DEPLOYED_BITCOIN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)

;; error messages
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u1000))
(define-constant ERR_FETCHING_TOKEN_DATA (err u1001))
(define-constant ERR_INSUFFICIENT_BALANCE (err u1002))
(define-constant ERR_PROPOSAL_NOT_FOUND (err u1003))
(define-constant ERR_PROPOSAL_VOTING_ACTIVE (err u1004))
(define-constant ERR_PROPOSAL_EXECUTION_DELAY (err u1005))
(define-constant ERR_PROPOSAL_RATE_LIMIT (err u1006))
(define-constant ERR_SAVING_PROPOSAL (err u1007))
(define-constant ERR_PROPOSAL_ALREADY_CONCLUDED (err u1008))
(define-constant ERR_RETRIEVING_START_BLOCK_HASH (err u1009))
(define-constant ERR_VOTE_TOO_SOON (err u1010))
(define-constant ERR_VOTE_TOO_LATE (err u1011))
(define-constant ERR_ALREADY_VOTED (err u1012))
(define-constant ERR_INVALID_ACTION (err u1013))

;; voting configuration
(define-constant VOTING_QUORUM u15) ;; 15% of liquid supply must participate
(define-constant VOTING_THRESHOLD u66) ;; 66% of votes must be in favor
(define-constant VOTING_BOND u100000000000) ;; action proposal bond, 1,000 DAO tokens w/ 8 decimals
(define-constant VOTING_REWARD u10000000000) ;; action proposal reward, 100 DAO tokens w/ 8 decimals
;; /g/.aibtc-treasury/dao_treasury_contract
(define-constant VOTING_TREASURY .aibtc-treasury) ;; used to calculate liquid supply

;; set voting delay
;; mainnet: 144 blocks (24 hours)
;; testnet: 1 blocks (10 minutes)
;; devnet: 144 blocks (24 hours)
(define-constant VOTING_DELAY (if is-in-mainnet u144 (if is-in-regtest u144 u1)))
;; set voting period
;; mainnet: 288 blocks (48 hours)
;; testnet: 3 blocks (30 minutes)
;; devnet: 288 blocks (48 hours)
(define-constant VOTING_PERIOD (if is-in-mainnet u288 (if is-in-regtest u288 u3)))

(define-constant REP_SUCCESS u1) ;; reputation increase on proposal success
(define-constant REP_FAILURE u2) ;; reputation decrease on proposal failure

;; data vars
;;

(define-data-var proposalCount uint u0) ;; total number of proposals
(define-data-var concludedProposalCount uint u0) ;; total number of concluded proposals
(define-data-var executedProposalCount uint u0) ;; total number of executed proposals

(define-data-var lastProposalStacksBlock uint u0) ;; stacks block height of last proposal created
(define-data-var lastProposalBitcoinBlock uint u0) ;; bitcoin block height of last proposal created

;; data maps
;;

(define-map ProposalDetails
  uint ;; proposal ID
  {
    action: principal, ;; action contract to execute
    parameters: (buff 2048), ;; parameters to pass to action contract
    bond: uint, ;; proposal bond amount
    caller: principal, ;; contract-caller
    creator: principal, ;; tx-sender
    creatorUserId: uint, ;; user index in DAO
    liquidTokens: uint, ;; liquid tokens
    memo: (optional (string-ascii 1024)), ;; memo for the proposal
  }
)

(define-map ProposalBlocks
  uint ;; proposal id
  {
    createdBtc: uint, ;; bitcoin block height
    createdStx: uint, ;; stacks block height for at-block calls
    voteStart: uint, ;; bitcoin block height
    voteEnd: uint, ;; bitcoin block height
    execStart: uint, ;; bitcoin block height
    execEnd: uint, ;; bitcoin block height
  }
)

(define-map ProposalRecords
  uint ;; proposal id
  {
    ;; accumulated in proposal life cycle
    votesFor: uint, ;; total votes for
    votesAgainst: uint, ;; total votes against
    vetoVotes: uint, ;; total veto votes
    ;; updated after conclusion
    concluded: bool, ;; was the proposal concluded
    metQuorum: bool, ;; did the proposal meet quorum
    metThreshold: bool, ;; did the proposal meet threshold
    passed: bool, ;; did the proposal pass
    executed: bool, ;; did the proposal execute
    vetoed: bool, ;; was the proposal vetoed
  }
)

(define-map VoteRecords
  {
    proposalId: uint, ;; proposal id
    voter: principal ;; voter address
  }
  {
    vote: bool, ;; true for yes, false for no
    amount: uint, ;; total votes
  }
)

(define-map VetoVoteRecords
  {
    proposalId: uint, ;; proposal id
    voter: principal ;; voter address
  }
  uint ;; total veto votes
)

;; public functions
;;

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (create-action-proposal (action <action-trait>) (parameters (buff 2048)) (memo (optional (string-ascii 1024))))
  (let
    (
      (actionContract (contract-of action))
      ;; /g/.aibtc-dao-users/dao_users_contract
      (userId (try! (contract-call? .aibtc-dao-users get-or-create-user-index tx-sender)))
      (newId (+ (var-get proposalCount) u1))
      (createdStx (- stacks-block-height u1))
      (createdBtc burn-block-height)
      (liquidTokens (try! (get-liquid-supply createdStx)))
      (voteStart (+ burn-block-height VOTING_DELAY))
      (voteEnd (+ voteStart VOTING_PERIOD))
      (execStart (+ voteEnd VOTING_DELAY))
      (execEnd (+ execStart VOTING_PERIOD))
      ;; /g/.aibtc-token/dao_token_contract
      (senderBalance (unwrap! (contract-call? .aibtc-token get-balance tx-sender) ERR_FETCHING_TOKEN_DATA))
      (validAction (is-action-valid action))
    )
    ;; liquidTokens is greater than zero
    (asserts! (> liquidTokens u0) ERR_FETCHING_TOKEN_DATA)
    ;; verify this extension and action contract are active in dao
    (asserts! validAction ERR_INVALID_ACTION)
    ;; verify the parameters are valid
    (try! (contract-call? action check-parameters parameters))
    ;; at least one btc block has passed since last proposal
    (asserts! (> createdBtc (var-get lastProposalBitcoinBlock)) ERR_PROPOSAL_RATE_LIMIT)
    ;; caller has the required balance
    (asserts! (> senderBalance VOTING_BOND) ERR_INSUFFICIENT_BALANCE)
    ;; transfer the proposal bond to this contract
    ;; /g/.aibtc-token/dao_token_contract
    (try! (contract-call? .aibtc-token transfer VOTING_BOND tx-sender SELF none))
    ;; print proposal creation event
    (print {
      ;; /g/aibtc/dao_token_symbol
      notification: "aibtc-action-proposal-voting/propose-action",
      payload: {
        contractCaller: contract-caller,
        txSender: tx-sender,
        action: actionContract,
        parameters: parameters,
        bond: VOTING_BOND,
        caller: contract-caller,
        creator: tx-sender,
        creatorUserId: userId,
        liquidTokens: liquidTokens,
        memo: (if (is-some memo) memo none),
        createdBtc: createdBtc,
        createdStx: createdStx,
        voteStart: voteStart,
        voteEnd: voteEnd,
        execStart: execStart,
        execEnd: execEnd,
        proposalId: newId,
        votingPeriod: VOTING_PERIOD,
        votingQuorum: VOTING_QUORUM,
        votingThreshold: VOTING_THRESHOLD,
        votingDelay: VOTING_DELAY,
        votingReward: VOTING_REWARD,
      }
    })
    ;; create the proposal details
    (asserts! (map-insert ProposalDetails newId {
      action: actionContract,
      parameters: parameters,
      bond: VOTING_BOND,
      caller: contract-caller,
      creator: tx-sender,
      creatorUserId: userId,
      liquidTokens: liquidTokens,
      memo: (if (is-some memo) memo none),
    }) ERR_SAVING_PROPOSAL)
    ;; create the proposal blocks
    (asserts! (map-insert ProposalBlocks newId {
      createdBtc: createdBtc,
      createdStx: createdStx,
      voteStart: voteStart,
      voteEnd: voteEnd,
      execStart: execStart,
      execEnd: execEnd,
    }) ERR_SAVING_PROPOSAL)
    ;; create the proposal record
    (asserts! (map-insert ProposalRecords newId {
      votesFor: u0,
      votesAgainst: u0,
      vetoVotes: u0,
      concluded: false,
      metQuorum: false,
      metThreshold: false,
      passed: false,
      executed: false,
      vetoed: false,
    }) ERR_SAVING_PROPOSAL)
    ;; set last proposal created block height
    (var-set lastProposalBitcoinBlock createdBtc)
    (var-set lastProposalStacksBlock createdStx)
    ;; increment proposal count
    (ok (var-set proposalCount newId))
  )
)

(define-public (vote-on-action-proposal (proposalId uint) (vote bool))
  (let
    (
      (proposalRecord (unwrap! (map-get? ProposalRecords proposalId) ERR_PROPOSAL_NOT_FOUND))
      (proposalBlocks (unwrap! (map-get? ProposalBlocks proposalId) ERR_PROPOSAL_NOT_FOUND))
      (proposalBlock (get createdStx proposalBlocks))
      (proposalBlockHash (unwrap! (get-block-hash proposalBlock) ERR_RETRIEVING_START_BLOCK_HASH))
      ;; /g/.aibtc-token/dao_token_contract
      (senderBalance (unwrap! (at-block proposalBlockHash (contract-call? .aibtc-token get-balance tx-sender)) ERR_FETCHING_TOKEN_DATA))
      ;; /g/.aibtc-dao-users/dao_users_contract
      (userId (try! (contract-call? .aibtc-dao-users get-or-create-user-index tx-sender)))
      (voterRecord (map-get? VoteRecords {proposalId: proposalId, voter: tx-sender}))
      (previousVote (if (is-some voterRecord) (some (get vote (unwrap-panic voterRecord))) none))
      (previousVoteAmount (if (is-some voterRecord) (some (get amount (unwrap-panic voterRecord))) none))
    )
    ;; caller has the required balance
    (asserts! (> senderBalance u0) ERR_INSUFFICIENT_BALANCE)
    ;; proposal was not already concluded
    (asserts! (not (get concluded proposalRecord)) ERR_PROPOSAL_ALREADY_CONCLUDED)
    ;; proposal vote is still active
    (asserts! (>= burn-block-height (get voteStart proposalBlocks)) ERR_VOTE_TOO_SOON)
    (asserts! (< burn-block-height (get voteEnd proposalBlocks)) ERR_VOTE_TOO_LATE)
    ;; proposal vote not already cast
    (and (is-some voterRecord)
      (asserts! (not (is-eq (get vote (unwrap-panic voterRecord)) vote)) ERR_ALREADY_VOTED)
    )
    ;; print vote event
    (print {
      ;; /g/aibtc/dao_token_symbol
      notification: "aibtc-action-proposal-voting/vote-on-proposal",
      payload: {
        contractCaller: contract-caller,
        txSender: tx-sender,
        voter: tx-sender,
        voterUserId: userId,
        proposalId: proposalId,
        amount: senderBalance,
        vote: vote,
      }
    })
    (and (is-some previousVote)
      ;; update the proposal record to remove the previous vote
      (map-set ProposalRecords proposalId
        (if (is-eq (unwrap-panic previousVote) true)
          (merge proposalRecord {votesFor: (- (get votesFor proposalRecord) (unwrap-panic previousVoteAmount))})
          (merge proposalRecord {votesAgainst: (- (get votesAgainst proposalRecord) (unwrap-panic previousVoteAmount))})
        )
      )
    )
    ;; update the proposal record
    (map-set ProposalRecords proposalId
      (if vote
        (merge proposalRecord {votesFor: (+ (get votesFor proposalRecord) senderBalance)})
        (merge proposalRecord {votesAgainst: (+ (get votesAgainst proposalRecord) senderBalance)})
      )
    )
    ;; record the vote for the sender
    (ok (map-set VoteRecords {proposalId: proposalId, voter: tx-sender} {vote: vote, amount: senderBalance}))
  )
)

(define-public (veto-action-proposal (proposalId uint))
  (let
    (
      (proposalRecord (unwrap! (map-get? ProposalRecords proposalId) ERR_PROPOSAL_NOT_FOUND))
      (proposalBlocks (unwrap! (map-get? ProposalBlocks proposalId) ERR_PROPOSAL_NOT_FOUND))
      (proposalBlock (get createdStx proposalBlocks))
      (proposalBlockHash (unwrap! (get-block-hash proposalBlock) ERR_RETRIEVING_START_BLOCK_HASH))
      ;; /g/.aibtc-token/dao_token_contract
      (senderBalance (unwrap! (at-block proposalBlockHash (contract-call? .aibtc-token get-balance tx-sender)) ERR_FETCHING_TOKEN_DATA))
      ;; /g/.aibtc-dao-users/dao_users_contract
      (userId (try! (contract-call? .aibtc-dao-users get-or-create-user-index tx-sender)))
    )
    ;; caller has the required balance
    (asserts! (> senderBalance u0) ERR_INSUFFICIENT_BALANCE)
    ;; proposal was not already concluded
    (asserts! (not (get concluded proposalRecord)) ERR_PROPOSAL_ALREADY_CONCLUDED)
    ;; proposal vote ended, in execution delay
    (asserts! (>= burn-block-height (get voteEnd proposalBlocks)) ERR_VOTE_TOO_SOON)
    (asserts! (< burn-block-height (get execStart proposalBlocks)) ERR_VOTE_TOO_LATE)
    ;; veto not already cast
    (asserts! (is-none (map-get? VetoVoteRecords {proposalId: proposalId, voter: tx-sender})) ERR_ALREADY_VOTED)
    ;; print veto event
    (print {
      ;; /g/aibtc/dao_token_symbol
      notification: "aibtc-action-proposal-voting/veto-action-proposal",
      payload: {
        contractCaller: contract-caller,
        txSender: tx-sender,
        vetoer: tx-sender,
        vetoerUserId: userId,
        proposalId: proposalId,
        amount: senderBalance,
      }
    })
    ;; update the proposal record
    (map-set ProposalRecords proposalId
      (merge proposalRecord {
        vetoVotes: (+ (get vetoVotes proposalRecord) senderBalance),
      })
    )
    ;; update the veto vote record for the sender
    (ok (map-set VetoVoteRecords {proposalId: proposalId, voter: tx-sender} senderBalance))
  )
)

(define-public (conclude-action-proposal (proposalId uint) (action <action-trait>))
  (let
    (
      (actionContract (contract-of action))
      (proposalDetails (unwrap! (map-get? ProposalDetails proposalId) ERR_PROPOSAL_NOT_FOUND))
      (proposalBlocks (unwrap! (map-get? ProposalBlocks proposalId) ERR_PROPOSAL_NOT_FOUND))
      (proposalRecord (unwrap! (map-get? ProposalRecords proposalId) ERR_PROPOSAL_NOT_FOUND))
      (creator (get creator proposalDetails))
      (liquidTokens (get liquidTokens proposalDetails))
      (votesFor (get votesFor proposalRecord))
      (votesAgainst (get votesAgainst proposalRecord))
      (vetoVotes (get vetoVotes proposalRecord))
      (hasVotes (> (+ votesFor votesAgainst) u0))
      (metQuorum (and hasVotes
        (>= (/ (* (+ votesFor votesAgainst) u100) liquidTokens) VOTING_QUORUM)
      ))
      (metThreshold (and hasVotes
        (>= (/ (* votesFor u100) (+ votesFor votesAgainst)) VOTING_THRESHOLD)
      ))
      (vetoMetQuorum (and (> vetoVotes u0)
        (>= (/ (* vetoVotes u100) liquidTokens) VOTING_QUORUM)
      ))
      ;; evaluate criteria to determine if proposal passed
      (votePassed (and
        hasVotes ;; check if there are any votes
        metQuorum ;; quorum: total votes vs liquid supply
        metThreshold ;; threshold: enough yes votes vs total votes
        (not vetoMetQuorum) ;; veto quorum: total veto votes vs liquid supply
      ))
      ;; check info for running action
      (validAction (is-action-valid action))
      (notExpired (< burn-block-height (get execEnd proposalBlocks)))
      (tryToExecute (and votePassed validAction notExpired))
    )
    ;; proposal not already concluded
    (asserts! (not (get concluded proposalRecord)) ERR_PROPOSAL_ALREADY_CONCLUDED)
    ;; proposal is past voting period
    (asserts! (>= burn-block-height (get voteEnd proposalBlocks)) ERR_PROPOSAL_VOTING_ACTIVE)
    ;; proposal is past execution delay
    (asserts! (>= burn-block-height (get execStart proposalBlocks)) ERR_PROPOSAL_EXECUTION_DELAY)
    ;; action must be the same as the one in proposal
    (asserts! (is-eq (get action proposalDetails) actionContract) ERR_INVALID_ACTION)
    ;; record user in dao if not already
    ;; /g/.aibtc-dao-users/dao_users_contract
    (try! (contract-call? .aibtc-dao-users get-or-create-user-index tx-sender))
    ;; print conclusion event
    (print {
      ;; /g/aibtc/dao_token_symbol
      notification: "aibtc-action-proposal-voting/conclude-proposal",
      payload: {
        contractCaller: contract-caller,
        txSender: tx-sender,
        action: actionContract,
        parameters: (get parameters proposalDetails),
        bond: (get bond proposalDetails),
        creator: creator,
        creatorUserId: (get creatorUserId proposalDetails),
        liquidTokens: liquidTokens,
        memo: (get memo proposalDetails),
        proposalId: proposalId,
        votesFor: votesFor,
        votesAgainst: votesAgainst,
        vetoVotes: vetoVotes,
        metQuorum: metQuorum,
        metThreshold: metThreshold,
        vetoMetQuorum: vetoMetQuorum,
        passed: votePassed,
        expired: (not notExpired),
        executed: tryToExecute,
      }
    })
    ;; update the proposal record
    (map-set ProposalRecords proposalId
      (merge proposalRecord {
        concluded: true,
        metQuorum: metQuorum,
        metThreshold: metThreshold,
        passed: votePassed,
        executed: tryToExecute,
        vetoed: vetoMetQuorum,
      })
    )

    ;; transfer the bond based on the outcome
    (if votePassed
      ;; /g/.aibtc-token/dao_token_contract
      (try! (as-contract (contract-call? .aibtc-token transfer (get bond proposalDetails) SELF creator none)))
      ;; /g/.aibtc-token/dao_token_contract
      (try! (as-contract (contract-call? .aibtc-token transfer (get bond proposalDetails) SELF VOTING_TREASURY none)))
    )
    ;; update the users reputation based on outcome
    (if votePassed
      ;; /g/.aibtc-dao-users/dao_users_contract
      (try! (as-contract (contract-call? .aibtc-dao-users increase-user-reputation creator REP_SUCCESS)))
      ;; /g/.aibtc-dao-users/dao_users_contract
      (try! (as-contract (contract-call? .aibtc-dao-users decrease-user-reputation creator REP_FAILURE)))
    )
    ;; increment the concluded proposal count
    (var-set concludedProposalCount (+ (var-get concludedProposalCount) u1))
    ;; try to execute the action if the proposal passed
    ;;   returns (ok true) if the action successfully executes
    ;;   returns (ok false) if the action was not executed or executed with an error
    (ok (if tryToExecute
      (and
        ;; increment the executed proposal count
        (var-set executedProposalCount (+ (var-get executedProposalCount) u1))
        ;; try to run the action
        (match (contract-call? action run (get parameters proposalDetails))
          ;; transfer reward to creator
          ;; /g/.aibtc-treasury/dao_treasury_contract
          ;; /g/.aibtc-token/dao_token_contract
          ok_ (try! (as-contract (contract-call? .aibtc-treasury withdraw-ft .aibtc-token VOTING_REWARD creator)))
          ;; return false and print error on failure
          ;; /g/aibtc/dao_token_symbol
          err_ (begin (print {notification: "aibtc-action-proposal-voting/conclude-proposal", payload: {executionError:err_}}) false)))
      false
    ))
  )
)

;; read only functions
;;

(define-read-only (get-voting-power (proposalId uint) (voter principal))
  (let
    (
      (proposalBlocks (unwrap! (map-get? ProposalBlocks proposalId) ERR_PROPOSAL_NOT_FOUND))
      (proposalBlockHash (unwrap! (get-block-hash (get createdStx proposalBlocks)) ERR_RETRIEVING_START_BLOCK_HASH))
    )
    ;; /g/.aibtc-token/dao_token_contract
    (at-block proposalBlockHash (contract-call? .aibtc-token get-balance voter))
  )
)

(define-read-only (get-proposal (proposalId uint))
  (let
    (
      (proposalDetails (unwrap! (map-get? ProposalDetails proposalId) none))
      (proposalBlocks (unwrap! (map-get? ProposalBlocks proposalId) none))
      (proposalRecord (unwrap! (map-get? ProposalRecords proposalId) none))
    )
    (some (merge proposalDetails (merge proposalBlocks proposalRecord)))
  )
)

(define-read-only (get-vote-record (proposalId uint) (voter principal))
  (map-get? VoteRecords {proposalId: proposalId, voter: voter})
)

(define-read-only (get-veto-vote-record (proposalId uint) (voter principal))
  (map-get? VetoVoteRecords {proposalId: proposalId, voter: voter})
)

(define-read-only (get-vote-records (proposalId uint) (voter principal))
  {
    voteRecord: (get-vote-record proposalId voter),
    vetoVoteRecord: (get-veto-vote-record proposalId voter),
  }
)

(define-read-only (get-total-proposals)
  {
    proposalCount: (var-get proposalCount),
    concludedProposalCount: (var-get concludedProposalCount),
    executedProposalCount: (var-get executedProposalCount),
    lastProposalStacksBlock: (var-get lastProposalStacksBlock),
    lastProposalBitcoinBlock: (var-get lastProposalBitcoinBlock),
  }
)

(define-read-only (get-voting-configuration)
  {
    self: SELF,
    deployedBitcoinBlock: DEPLOYED_BITCOIN_BLOCK,
    deployedStacksBlock: DEPLOYED_STACKS_BLOCK,
    delay: VOTING_DELAY,
    period: VOTING_PERIOD,
    quorum: VOTING_QUORUM,
    threshold: VOTING_THRESHOLD,
    treasury: VOTING_TREASURY,
    proposalBond: VOTING_BOND,
    proposalReward: VOTING_REWARD,
  }
)

;; calculate the liquid supply of the dao token at a past stacks block height
(define-read-only (get-liquid-supply (blockHeight uint))
  (let
    (
      (blockHash (unwrap! (get-block-hash blockHeight) ERR_RETRIEVING_START_BLOCK_HASH))
      ;; /g/.aibtc-token/dao_token_contract
      (totalSupply (unwrap! (at-block blockHash (contract-call? .aibtc-token get-total-supply)) ERR_FETCHING_TOKEN_DATA))
      ;; /g/.aibtc-token/dao_token_contract
      (treasuryBalance (unwrap! (at-block blockHash (contract-call? .aibtc-token get-balance VOTING_TREASURY)) ERR_FETCHING_TOKEN_DATA))
    )
    (ok (- totalSupply treasuryBalance))
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

(define-private (is-action-valid (action <action-trait>))
  (let
    (
      (extensionActive (is-ok (as-contract (is-dao-or-extension))))
      ;; /g/.aibtc-base-dao/dao_base_contract
      (actionActive (contract-call? .aibtc-base-dao is-extension (contract-of action)))
    )
    (and extensionActive actionActive)
  )
)

(define-private (get-block-hash (blockHeight uint))
  (get-stacks-block-info? id-header-hash blockHeight)
)
