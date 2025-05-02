import { ContractBase } from "./contract-template";
import {
  DEPLOYMENT_ORDER,
  DaoContractAddresses,
} from "../utilities/contract-deployment-order";
import { ContractType } from "../utilities/contract-types";

export class BaseContract extends ContractBase {
  constructor(
    name: DaoContractAddresses,
    Subtype: "DAO" | "AGENT_ACCOUNT" | "DAO_RUN_COST"
  ) {
    super(
      name,
      "BASE" as ContractType,
      Subtype,
      DEPLOYMENT_ORDER[name],
      `${name}.clar`
    );
  }
}
