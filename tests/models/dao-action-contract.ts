import { ContractBase } from "./contract-template";
import {
  DEPLOYMENT_ORDER,
  DaoContractAddresses,
} from "../utilities/contract-deployment-order";
import { ContractType } from "../utilities/contract-types";

export class ActionContract extends ContractBase {
  constructor(name: DaoContractAddresses, Subtype: "SEND_MESSAGE") {
    super(
      name,
      "ACTIONS" as ContractType,
      Subtype,
      DEPLOYMENT_ORDER[name],
      `actions/${name}.clar`
    );
  }
}
