import { ContractBase } from "./contract-template";
import { DEPLOYMENT_ORDER } from "../../utilities/contract-deployment-order";
import { ContractSubtype } from "../../utilities/contract-types";

export class BaseContract extends ContractBase {
  constructor(name: string, subtype: ContractSubtype<"BASE">) {
    super(
      name,
      "BASE",
      subtype,
      DEPLOYMENT_ORDER[name] || 0,
      ContractBase.generateTemplatePath("BASE", name)
    );
  }
}
