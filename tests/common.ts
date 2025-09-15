import { Cl } from "@stacks/transactions";

export const TEST_MEMO = "Test memo used with buff";
export const TEST_MEMO_CV = Cl.some(Cl.stringAscii(TEST_MEMO));
