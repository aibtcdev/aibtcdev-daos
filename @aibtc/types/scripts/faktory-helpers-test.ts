import {
  getFaktoryBridgeContractsById,
  getFaktoryBridgeContractsByDaoName,
  getIdFromFaktoryDaoName,
} from "@aibtc/types";

const expectedFacedrop = {
  daoName: "facedrop",
  dexContract:
    "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.facedrop-faktory-dex",
  ftContract: "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.facedrop-faktory",
  poolContract:
    "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.xyk-pool-sbtc-facedrop-v-1-1",
  preContract:
    "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.facedrop-pre-faktory",
};

console.log("================================");
console.log("Test 1 - getFaktoryBridgeContractsById valid");
console.log("Input:", 1);
console.log("Expected Output:", expectedFacedrop);

const byIdValid = getFaktoryBridgeContractsById(1);
if (JSON.stringify(byIdValid) !== JSON.stringify(expectedFacedrop)) {
  throw new Error(
    `Expected ${JSON.stringify(expectedFacedrop)}, got ${JSON.stringify(byIdValid)}`
  );
}
console.log("Test 1 Result: ", byIdValid);

console.log("================================");
console.log("Test 2 - getFaktoryBridgeContractsById invalid");
console.log("Input:", 999);
console.log("Expected Output:", null);

const byIdInvalid = getFaktoryBridgeContractsById(999);
if (byIdInvalid !== null) {
  throw new Error(
    `Expected null, got ${JSON.stringify(byIdInvalid)}`
  );
}
console.log("Test 2 Result: ", byIdInvalid);

console.log("================================");
console.log("Test 3 - getFaktoryBridgeContractsByDaoName valid");
console.log("Input:", "facedrop");
console.log("Expected Output:", expectedFacedrop);

const byNameValid = getFaktoryBridgeContractsByDaoName("facedrop");
if (JSON.stringify(byNameValid) !== JSON.stringify(expectedFacedrop)) {
  throw new Error(
    `Expected ${JSON.stringify(expectedFacedrop)}, got ${JSON.stringify(byNameValid)}`
  );
}
console.log("Test 3 Result: ", byNameValid);

console.log("================================");
console.log("Test 4 - getFaktoryBridgeContractsByDaoName invalid");
console.log("Input:", "invalid");
console.log("Expected Output:", null);

const byNameInvalid = getFaktoryBridgeContractsByDaoName("invalid");
if (byNameInvalid !== null) {
  throw new Error(
    `Expected null, got ${JSON.stringify(byNameInvalid)}`
  );
}
console.log("Test 4 Result: ", byNameInvalid);

console.log("================================");
console.log("Test 5 - getIdFromFaktoryDaoName valid");
console.log("Input:", "facedrop");
console.log("Expected Output:", 1);

const idFromNameValid = getIdFromFaktoryDaoName("facedrop");
if (idFromNameValid !== 1) {
  throw new Error(
    `Expected 1, got ${idFromNameValid}`
  );
}
console.log("Test 5 Result: ", idFromNameValid);

console.log("================================");
console.log("Test 6 - getIdFromFaktoryDaoName invalid");
console.log("Input:", "invalid");
console.log("Expected Output:", null);

const idFromNameInvalid = getIdFromFaktoryDaoName("invalid");
if (idFromNameInvalid !== null) {
  throw new Error(
    `Expected null, got ${idFromNameInvalid}`
  );
}
console.log("Test 6 Result: ", idFromNameInvalid);

console.log("================================");
console.log("All tests passed!");
