import { ContractBase } from "./contract-template";
import {
  DEPLOYMENT_ORDER,
  DaoContractAddresses,
} from "../utilities/contract-deployment-order";
import { ContractSubtype } from "../utilities/contract-types";

export class CoreContract extends ContractBase {
  constructor(
    name: DaoContractAddresses,
    subtype: ContractSubtype<"CORE">
  ) {
    super(
      name,
      "CORE",
      subtype,
      DEPLOYMENT_ORDER[name],
      ContractBase.generateTemplatePath("CORE", name)
    );
  }
}
