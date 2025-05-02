import { ContractBase } from "./contract-template";
import { DEPLOYMENT_ORDER } from "../utilities/contract-deployment-order";
import { ContractSubtype, CONTRACT_NAMES } from "../utilities/contract-types";

export class ActionContract extends ContractBase {
  constructor(name: string, subtype: ContractSubtype<"ACTIONS">) {
    // Validate that the name is a valid contract name for this type/subtype
    const validName = CONTRACT_NAMES.ACTIONS[subtype];
    if (!validName || name !== validName) {
      throw new Error(`Invalid contract name for ACTIONS/${subtype}: ${name}`);
    }

    super(
      name,
      "ACTIONS",
      subtype,
      DEPLOYMENT_ORDER[name] || 0,
      ContractBase.generateTemplatePath("ACTIONS", name)
    );
  }
}
