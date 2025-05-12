import { ContractBase } from "./contract-template";
import { DEPLOYMENT_ORDER } from "../../utilities/contract-deployment-order";
import { ContractSubtype } from "../../utilities/contract-types";

export class ExternalContract extends ContractBase {
  constructor(name: string, subtype: ContractSubtype<"EXTERNAL">) {
    super(
      name,
      "EXTERNAL",
      subtype,
      DEPLOYMENT_ORDER[name] || 0,
      ContractBase.generateTemplatePath("EXTERNAL", name)
    );
  }
}
