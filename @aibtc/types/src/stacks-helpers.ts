import {
  addressToString,
  AddressVersion,
  parsePrincipalString,
  validateStacksAddress,
} from "@stacks/transactions";

type StacksAddressPair = {
  mainnet: string;
  testnet: string;
};

/**
 * Returns mainnet and testnet addresses based on a given address.
 * @param address - The address to check.
 * @returns An object containing mainnet and testnet addresses.
 */
export function getStacksAddressPair(address: string): StacksAddressPair {
  try {
    // validate first
    if (!validateStacksAddress(address)) {
      throw new Error(`Invalid Stacks address: ${address}`);
    }
    let testnetAddress = "";
    let mainnetAddress = "";
    // detect network from address
    const principalWire = parsePrincipalString(address);
    const addressWire = principalWire.address;
    const isMainnet =
      addressWire.version === AddressVersion.MainnetSingleSig ||
      addressWire.version === AddressVersion.MainnetMultiSig;

    if (isMainnet) {
      mainnetAddress = address;
      const mainnetVersion = addressWire.version;
      // convert to testnet
      const testnetAddressWire = {
        ...addressWire,
        version:
          mainnetVersion === AddressVersion.MainnetSingleSig
            ? AddressVersion.TestnetSingleSig
            : AddressVersion.TestnetMultiSig,
      };
      testnetAddress = addressToString(testnetAddressWire);
    } else {
      testnetAddress = address;
      const testnetVersion = addressWire.version;
      // convert to mainnet
      const mainnetAddressWire = {
        ...addressWire,
        version:
          testnetVersion === AddressVersion.TestnetSingleSig
            ? AddressVersion.MainnetSingleSig
            : AddressVersion.MainnetMultiSig,
      };
      mainnetAddress = addressToString(mainnetAddressWire);
    }

    return {
      mainnet: mainnetAddress,
      testnet: testnetAddress,
    };
  } catch (error) {
    // If any error occurs (invalid address, parsing error), return empty strings
    console.error(error);
    return {
      mainnet: "",
      testnet: "",
    };
  }
}
