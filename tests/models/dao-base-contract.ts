import { ContractBase } from "./contract-template";
import { DEPLOYMENT_ORDER } from "../utilities/contract-deployment-order";
import { ContractSubtype, CONTRACT_NAMES } from "../utilities/contract-types";

export class BaseContract extends ContractBase {
  constructor(name: string, subtype: ContractSubtype<"BASE">) {
    // Validate that the name is a valid contract name for this type/subtype
    const validName = CONTRACT_NAMES.BASE[subtype];
    if (!validName || name !== validName) {
      throw new Error(`Invalid contract name for BASE/${subtype}: ${name}`);
    }

    super(
      name,
      "BASE",
      subtype,
      DEPLOYMENT_ORDER[name] || 0,
      ContractBase.generateTemplatePath("BASE", name)
    );
  }
}
