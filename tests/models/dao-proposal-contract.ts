import { ContractBase } from "./contract-template";
import {
  DEPLOYMENT_ORDER,
  DaoContractAddresses,
} from "../utilities/contract-deployment-order";
import { ContractType } from "../utilities/contract-types";

export class ProposalContract extends ContractBase {
  constructor(name: DaoContractAddresses, Subtype: "INITIALIZE_DAO") {
    super(
      name,
      "PROPOSALS" as ContractType,
      Subtype,
      DEPLOYMENT_ORDER[name],
      `proposals/${name}.clar`
    );
  }
}
