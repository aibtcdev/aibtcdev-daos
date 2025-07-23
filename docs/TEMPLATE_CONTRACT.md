# [Contract Name]

**Source:** [`[contract-name].clar`](../contracts/[path/to/contract.clar])

## 1. Overview

[A brief, one-paragraph summary of the contract's purpose and primary function. What problem does it solve? Who are the primary users/actors?]

---

## 2. Public Functions

[List and describe each public function. Use the format below.]

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

## 3. Read-Only Functions

[List and describe each read-only function.]

### `function-name`

... (same format as public functions)

---

## 4. Private Functions

[List and describe each private function.]

### `function-name`

... (same format as public functions)

---

## 5. Constants

[List and describe any important constants.]

- `CONSTANT_NAME`: [Description of the constant's purpose and value.]

---

## 6. Variables

[List and describe any important state variables.]

- `variable-name`: [Description of the variable's purpose.]

---

## 7. Data Maps

[List and describe any data maps.]

- `map-name`: [Description of the map's purpose, key type, and value type.]

---

## 8. Errors

[List and describe custom error codes.]

- `(err u100)`: Description of error 100.
- `(err u101)`: Description of error 101.
