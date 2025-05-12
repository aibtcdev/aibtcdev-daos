import { ContractBase } from "./contract-template";
import { DEPLOYMENT_ORDER } from "../utilities/contract-deployment-order";
import { ContractSubtype } from "../utilities/contract-types";

export class ActionContract extends ContractBase {
  constructor(name: string, subtype: ContractSubtype<"ACTIONS">) {
    super(
      name,
      "ACTIONS",
      subtype,
      DEPLOYMENT_ORDER[name] || 0,
      ContractBase.generateTemplatePath("ACTIONS", name)
    );
  }
}
