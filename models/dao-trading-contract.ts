import { ContractBase } from "./contract-template";
import { DEPLOYMENT_ORDER } from "../utilities/contract-deployment-order";
import { ContractSubtype } from "../utilities/contract-types";

export class TradingContract extends ContractBase {
  constructor(name: string, subtype: ContractSubtype<"TRADING">) {
    super(
      name,
      "TRADING",
      subtype,
      DEPLOYMENT_ORDER[name] || 0,
      ContractBase.generateTemplatePath("TRADING", name)
    );
  }
}
