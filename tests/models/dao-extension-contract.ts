import { ContractBase } from "./contract-template";
import {
  DEPLOYMENT_ORDER,
  DeploymentKeys,
} from "../utilities/contract-deployment-order";
import { ContractType } from "../utilities/contract-types";

export class ExtensionContract extends ContractBase {
  constructor(
    name: DeploymentKeys,
    Subtype:
      | "ACTION_PROPOSAL_VOTING"
      | "DAO_CHARTER"
      | "DAO_EPOCH"
      | "DAO_USERS"
      | "ONCHAIN_MESSAGING"
      | "REWARDS_ACCOUNT"
      | "TOKEN_OWNER"
      | "TREASURY"
  ) {
    super(
      name,
      "EXTENSIONS" as ContractType,
      Subtype,
      DEPLOYMENT_ORDER[name],
      `extensions/${name}.clar`
    );
  }
}
