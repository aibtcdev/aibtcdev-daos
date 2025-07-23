# [Contract Name]

**Source:** [`[contract-name].clar`](../contracts/[path/to/contract.clar])

## 1. Overview

[A brief, one-paragraph summary of the contract's purpose and primary function. What problem does it solve? Who are the primary users/actors?]

---

## 2. Called Contracts

[List and describe other contracts that this contract interacts with via `contract-call?`.]

- `contract-name-1`: [Brief description of the contract and the nature of the interaction.]
- `contract-name-2`: ...

---

## 3. Public Functions

[List and describe each public function. Use the format below.]

- [`function-name`](#function-name): [Brief, one-sentence description of the function.]
- ...

---

### `function-name`

`(function-name (arg1 type) (arg2 type) ...)`

**Description:**
[Explain what the function does, its purpose, and any important logic or side effects.]

**Parameters:**
- `arg1` (`type`): Description of the first parameter.
- `arg2` (`type`): Description of the second parameter.

**Returns:**
`(ok type)`: Description of what is returned on success.
`(err type)`: Description of what is returned on error.

---

## 4. Read-Only Functions

[List and describe each read-only function.]

- [`function-name`](#function-name): [Brief, one-sentence description of the function.]
- ...

---

### `function-name`

... (same format as public functions)

---

## 5. Private Functions

[List and describe each private function.]

- [`function-name`](#function-name): [Brief, one-sentence description of the function.]
- ...

---

### `function-name`

... (same format as public functions)

---

## 6. Constants

[List and describe any important constants.]

- `CONSTANT_NAME`: [Description of the constant's purpose and value.]

---

## 7. Variables

[List and describe any important state variables.]

- `variable-name`: [Description of the variable's purpose.]

---

## 8. Data Maps

[List and describe any data maps.]

- `map-name`: [Description of the map's purpose, key type, and value type.]

---

## 9. Errors

[List and describe custom error codes.]

- `(err u100)`: Description of error 100.
- `(err u101)`: Description of a new error.

---

## 10. Print Events

[List and describe any SIP-019 style print events emitted by the contract.]

- `event-name-1`: [Description of when this event is emitted and what its payload contains.]
- `event-name-2`: ...
