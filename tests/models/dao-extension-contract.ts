import { ContractBase } from "./contract-template";
import {
  DEPLOYMENT_ORDER,
  DaoContractAddresses,
} from "../utilities/contract-deployment-order";
import { ContractSubtype } from "../utilities/contract-types";

export class ExtensionContract extends ContractBase {
  constructor(
    name: DaoContractAddresses,
    subtype: ContractSubtype<"EXTENSIONS">
  ) {
    super(
      name,
      "EXTENSIONS",
      subtype,
      DEPLOYMENT_ORDER[name],
      ContractBase.generateTemplatePath("EXTENSIONS", name)
    );
  }
}
