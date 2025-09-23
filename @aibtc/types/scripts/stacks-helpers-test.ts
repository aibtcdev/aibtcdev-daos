import { getStacksAddressPair } from "@aibtc/types";

const expectedMainnetAddress = "SPP90JN2DSY4PHMKG613G3163A5VEQSN2KB2FAHP";
const expectedTestnetAddress = "STP90JN2DSY4PHMKG613G3163A5VEQSN2JCQ2W6J";

console.log("================================");
console.log("Test 1 - provide a mainnet address");
console.log("Input:", expectedMainnetAddress);
console.log("Expected Output:", {
  mainnet: expectedMainnetAddress,
  testnet: expectedTestnetAddress,
});

const mainnetTest = getStacksAddressPair(expectedMainnetAddress);
if (mainnetTest.mainnet !== expectedMainnetAddress) {
  throw new Error(
    `Expected mainnet address to be ${expectedMainnetAddress}, got ${mainnetTest.mainnet}`
  );
}
if (mainnetTest.testnet !== expectedTestnetAddress) {
  throw new Error(
    `Expected testnet address to be ${expectedTestnetAddress}, got ${mainnetTest.testnet}`
  );
}

console.log("Test 1 Result: ", mainnetTest);

console.log("================================");
console.log("Test 2 - provide a testnet address");
console.log("Input:", expectedTestnetAddress);
console.log("Expected Output:", {
  mainnet: expectedMainnetAddress,
  testnet: expectedTestnetAddress,
});

const testnetTest = getStacksAddressPair(expectedTestnetAddress);
if (testnetTest.mainnet !== expectedMainnetAddress) {
  throw new Error(
    `Expected mainnet address to be ${expectedMainnetAddress}, got ${testnetTest.mainnet}`
  );
}
if (testnetTest.testnet !== expectedTestnetAddress) {
  throw new Error(
    `Expected testnet address to be ${expectedTestnetAddress}, got ${testnetTest.testnet}`
  );
}

console.log("Test 2 Result: ", testnetTest);

console.log("================================");
console.log("All tests passed!");
