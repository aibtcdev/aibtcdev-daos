import { ClarityEvent } from "@hirosystems/clarinet-sdk";
import {
  ClarityType,
  ClarityValue,
  cvToValue,
  TupleCV,
} from "@stacks/transactions";

export const DEVNET_DEPLOYER = "'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
export const SBTC_CONTRACT =
  "'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token";

export const SBTC_ASSETS_MAP = ".sbtc-token.sbtc-token";
export const DAO_TOKEN_ASSETS_MAP = ".aibtc-faktory.SYMBOL-AIBTC-DAO";

// bigint replacer for json.stringify()
export function bigIntReplacer(_key: string, value: any) {
  typeof value === "bigint" ? value.toString() : value;
}

// detects a specialized type of print event from a stacks transaction that has the following structure:
// { notification: "title", payload: { ...data } }

type SIP019PrintEvent = {
  notification: string;
  payload: unknown;
};

export function convertSIP019PrintEvent(event: ClarityEvent): SIP019PrintEvent {
  // check if the event is a print event
  if (event.event !== "print_event") {
    throw new Error("Event is not a print event");
  }
  // check if the event data is a tuple
  if (event.data.value?.type !== ClarityType.Tuple) {
    throw new Error("Event data is not a tuple");
  }
  // verify the notification and payload keys exist
  const tupleData = event.data.value.value;
  if (!("notification" in tupleData) || !("payload" in tupleData)) {
    throw new Error(
      "Event data does not contain notification and payload keys"
    );
  }
  const payloadTuple = tupleData.payload as TupleCV;
  const payloadData = Object.fromEntries(
    Object.entries(payloadTuple.value).map(
      ([key, value]: [string, ClarityValue]) => {
        return [key, cvToValue(value, true)];
      }
    )
  );
  // return the typed event
  return {
    notification: cvToValue(tupleData.notification, true),
    payload: payloadData,
  };
}
