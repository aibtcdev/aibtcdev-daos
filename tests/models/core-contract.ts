import { ContractBase } from "./contract-template";
import { DEPLOYMENT_ORDER } from "../utilities/contract-deployment-order";
import { ContractSubtype } from "../utilities/contract-types";

export class CoreContract extends ContractBase {
  constructor(name: string, subtype: ContractSubtype<"CORE">) {
    super(
      name,
      "CORE",
      subtype,
      DEPLOYMENT_ORDER[name] || 0,
      ContractBase.generateTemplatePath("CORE", name)
    );
  }
}
