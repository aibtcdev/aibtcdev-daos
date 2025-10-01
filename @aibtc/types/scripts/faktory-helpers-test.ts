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
console.log("Test 7 - getFaktoryBridgeContractsById valid (facefast)");
console.log("Input:", 9);
const expectedFacefast = {
  daoName: "facefast",
  dexContract:
    "ST2HQ5J6RP8HSQE9KKGWCHW9PT9SVE4TDGBZQ3EKR.facefast-faktory-dex",
  ftContract: "ST2HQ5J6RP8HSQE9KKGWCHW9PT9SVE4TDGBZQ3EKR.facefast-faktory",
  poolContract:
    "ST2HQ5J6RP8HSQE9KKGWCHW9PT9SVE4TDGBZQ3EKR.xyk-pool-sbtc-facefast-v-1-1",
  preContract:
    "ST2HQ5J6RP8HSQE9KKGWCHW9PT9SVE4TDGBZQ3EKR.facefast-pre-faktory",
};
console.log("Expected Output:", expectedFacefast);

const byIdFacefast = getFaktoryBridgeContractsById(9);
if (JSON.stringify(byIdFacefast) !== JSON.stringify(expectedFacefast)) {
  throw new Error(
    `Expected ${JSON.stringify(expectedFacefast)}, got ${JSON.stringify(byIdFacefast)}`
  );
}
console.log("Test 7 Result: ", byIdFacefast);

console.log("================================");
console.log("Test 8 - getFaktoryBridgeContractsByDaoName valid (facefast)");
console.log("Input:", "facefast");
console.log("Expected Output:", expectedFacefast);

const byNameFacefast = getFaktoryBridgeContractsByDaoName("facefast");
if (JSON.stringify(byNameFacefast) !== JSON.stringify(expectedFacefast)) {
  throw new Error(
    `Expected ${JSON.stringify(expectedFacefast)}, got ${JSON.stringify(byNameFacefast)}`
  );
}
console.log("Test 8 Result: ", byNameFacefast);

console.log("================================");
console.log("Test 9 - getIdFromFaktoryDaoName valid (facefast)");
console.log("Input:", "facefast");
console.log("Expected Output:", 9);

const idFromNameFacefast = getIdFromFaktoryDaoName("facefast");
if (idFromNameFacefast !== 9) {
  throw new Error(
    `Expected 9, got ${idFromNameFacefast}`
  );
}
console.log("Test 9 Result: ", idFromNameFacefast);

console.log("================================");
console.log("Test 10 - getFaktoryBridgeContractsById valid (elonbtc)");
console.log("Input:", 10);
const expectedElonbtc = {
  daoName: "elonbtc",
  dexContract:
    "ST2HQ5J6RP8HSQE9KKGWCHW9PT9SVE4TDGBZQ3EKR.elonbtc-faktory-dex",
  ftContract: "ST2HQ5J6RP8HSQE9KKGWCHW9PT9SVE4TDGBZQ3EKR.elonbtc-faktory",
  poolContract:
    "ST2HQ5J6RP8HSQE9KKGWCHW9PT9SVE4TDGBZQ3EKR.xyk-pool-sbtc-elonbtc-v-1-1",
  preContract:
    "ST2HQ5J6RP8HSQE9KKGWCHW9PT9SVE4TDGBZQ3EKR.elonbtc-pre-faktory",
};
console.log("Expected Output:", expectedElonbtc);

const byIdElonbtc = getFaktoryBridgeContractsById(10);
if (JSON.stringify(byIdElonbtc) !== JSON.stringify(expectedElonbtc)) {
  throw new Error(
    `Expected ${JSON.stringify(expectedElonbtc)}, got ${JSON.stringify(byIdElonbtc)}`
  );
}
console.log("Test 10 Result: ", byIdElonbtc);

console.log("================================");
console.log("Test 11 - getFaktoryBridgeContractsByDaoName valid (elonbtc)");
console.log("Input:", "elonbtc");
console.log("Expected Output:", expectedElonbtc);

const byNameElonbtc = getFaktoryBridgeContractsByDaoName("elonbtc");
if (JSON.stringify(byNameElonbtc) !== JSON.stringify(expectedElonbtc)) {
  throw new Error(
    `Expected ${JSON.stringify(expectedElonbtc)}, got ${JSON.stringify(byNameElonbtc)}`
  );
}
console.log("Test 11 Result: ", byNameElonbtc);

console.log("================================");
console.log("Test 12 - getIdFromFaktoryDaoName valid (elonbtc)");
console.log("Input:", "elonbtc");
console.log("Expected Output:", 10);

const idFromNameElonbtc = getIdFromFaktoryDaoName("elonbtc");
if (idFromNameElonbtc !== 10) {
  throw new Error(
    `Expected 10, got ${idFromNameElonbtc}`
  );
}
console.log("Test 12 Result: ", idFromNameElonbtc);

console.log("================================");
console.log("All tests passed!");
