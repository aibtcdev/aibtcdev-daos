import { Cl, ClarityValue } from "@stacks/transactions";

// helper to format the expected buffer format since stacks 7.X
export function formatSerializedBuffer(value: ClarityValue): ClarityValue {
  const serialized = Cl.serialize(value);
  const buffer = Cl.bufferFromHex(serialized);
  return buffer;
}
