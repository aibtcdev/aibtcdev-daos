import { ClarityEvent } from "@hirosystems/clarinet-sdk";
import {
  ClarityType,
  ClarityValue,
  cvToValue,
  ListCV,
  ResponseErrorCV,
  ResponseOkCV,
  SomeCV,
  TupleCV,
} from "@stacks/transactions";

export const DEVNET_DEPLOYER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
export const SBTC_CONTRACT =
  "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token";

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

export function convertClarityTuple<T>(clarityValue: ClarityValue): T {
  if (clarityValue.type !== ClarityType.Tuple) {
    throw new Error(
      `Invalid format: expected tuple, got ${
        clarityValue.type
      }. Value: ${JSON.stringify(clarityValue)}`
    );
  }
  const tupleValue = clarityValue.value;
  return Object.fromEntries(
    Object.entries(tupleValue).map(([key, value]) => [
      key,
      cvToValue(value as ClarityValue),
    ])
  ) as T;
}

/**
 * Recursively decodes Clarity values into JavaScript objects
 *
 * @param value - The Clarity value to decode
 * @param strictJsonCompat - If true, ensures values are JSON compatible (defaults to true for consistent BigInt handling)
 * @param preserveContainers - If true, preserves container types in the output
 * @returns JavaScript representation of the Clarity value
 */
export function decodeClarityValues(
  value: ClarityValue,
  strictJsonCompat = true,
  preserveContainers = false
): any {
  switch (value.type) {
    case ClarityType.Tuple:
      return decodeTupleRecursively(
        value as TupleCV,
        strictJsonCompat,
        preserveContainers
      );
    case ClarityType.List:
      return decodeListRecursively(
        value as ListCV,
        strictJsonCompat,
        preserveContainers
      );
    case ClarityType.OptionalSome:
      if (preserveContainers) {
        return {
          type: ClarityType.OptionalSome,
          value: decodeClarityValues(
            (value as SomeCV).value,
            strictJsonCompat,
            preserveContainers
          ),
        };
      }
      return decodeClarityValues(
        (value as SomeCV).value,
        strictJsonCompat,
        preserveContainers
      );
    case ClarityType.ResponseOk:
      if (preserveContainers) {
        return {
          type: ClarityType.ResponseOk,
          value: decodeClarityValues(
            (value as ResponseOkCV).value,
            strictJsonCompat,
            preserveContainers
          ),
        };
      }
      return decodeClarityValues(
        (value as ResponseOkCV).value,
        strictJsonCompat,
        preserveContainers
      );
    case ClarityType.ResponseErr:
      if (preserveContainers) {
        return {
          type: ClarityType.ResponseErr,
          value: decodeClarityValues(
            (value as ResponseErrorCV).value,
            strictJsonCompat,
            preserveContainers
          ),
        };
      }
      return decodeClarityValues(
        (value as ResponseErrorCV).value,
        strictJsonCompat,
        preserveContainers
      );
    default:
      return cvToValue(value, strictJsonCompat);
  }
}

/**
 * Recursively decodes a Clarity tuple into a JavaScript object
 *
 * @param tuple - The Clarity tuple to decode
 * @param strictJsonCompat - If true, ensures values are JSON compatible (defaults to true for consistent BigInt handling)
 * @param preserveContainers - If true, preserves container types in the output
 * @returns JavaScript object representation of the tuple
 */
export function decodeTupleRecursively(
  tuple: TupleCV,
  strictJsonCompat = true,
  preserveContainers = false
): any {
  return Object.fromEntries(
    Object.entries(tuple.value).map(([key, value]) => {
      return [
        key,
        decodeClarityValues(value, strictJsonCompat, preserveContainers),
      ];
    })
  );
}

/**
 * Recursively decodes a Clarity list into a JavaScript array
 *
 * @param list - The Clarity list to decode
 * @param strictJsonCompat - If true, ensures values are JSON compatible (defaults to true for consistent BigInt handling)
 * @param preserveContainers - If true, preserves container types in the output
 * @returns JavaScript array representation of the list
 */
export function decodeListRecursively(
  list: ListCV,
  strictJsonCompat = true,
  preserveContainers = false
): any[] {
  return list.value.map((value) => {
    return decodeClarityValues(value, strictJsonCompat, preserveContainers);
  });
}
