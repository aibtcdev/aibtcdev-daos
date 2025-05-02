import { ContractBase } from "./contract-template";
import {
  DEPLOYMENT_ORDER,
  DaoContractAddresses,
} from "../utilities/contract-deployment-order";
import { ContractSubtype } from "../utilities/contract-types";

export class ExternalContract extends ContractBase {
  constructor(
    name: DaoContractAddresses,
    subtype: ContractSubtype<"EXTERNAL">
  ) {
    super(
      name,
      "EXTERNAL",
      subtype,
      DEPLOYMENT_ORDER[name],
      ContractBase.generateTemplatePath("EXTERNAL", name)
    );
  }
}
