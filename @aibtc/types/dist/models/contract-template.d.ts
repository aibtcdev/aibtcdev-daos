import { ClarityVersion } from "@stacks/transactions";
import { KnownAddresses } from "../utilities/known-addresses";
import { ContractSubtype, ContractType } from "../utilities/contract-types";
import { KnownTraits } from "../utilities/known-traits";
export interface AddressDependency {
    ref: keyof KnownAddresses;
    key: string;
}
export interface TraitDependency {
    ref: keyof KnownTraits;
    key: string;
}
export interface ContractDependency {
    key: string;
    category: ContractType;
    subcategory: ContractSubtype<ContractType>;
}
export interface RuntimeValue {
    key: string;
}
export interface DeploymentResult {
    sender: string;
    success: boolean;
    txId?: string;
    address: string;
    error?: string;
}
export declare abstract class ContractBase {
    readonly name: string;
    readonly type: ContractType;
    readonly subtype: ContractSubtype<ContractType>;
    readonly deploymentOrder: number;
    readonly templatePath: string;
    protected clarityVersion: ClarityVersion | undefined;
    protected _source?: string;
    protected _hash?: string;
    protected _deploymentResult?: DeploymentResult;
    static generateTemplatePath(type: ContractType, name: string): string;
    readonly requiredAddresses: AddressDependency[];
    readonly requiredTraits: TraitDependency[];
    readonly requiredContractAddresses: ContractDependency[];
    readonly requiredRuntimeValues: RuntimeValue[];
    constructor(name: string, type: ContractType, subtype: ContractSubtype<ContractType>, deploymentOrder: number, templatePath: string, clarityVersion?: ClarityVersion);
    get source(): string | undefined;
    get hash(): string | undefined;
    get isDeployed(): boolean;
    get deploymentResult(): DeploymentResult | undefined;
    setSource(source: string): this;
    setHash(hash: string): this;
    setDeploymentResult(result: DeploymentResult): this;
    addAddressDependency(ref: keyof KnownAddresses, key: string): this;
    addTraitDependency(ref: keyof KnownTraits, key: string): this;
    addContractDependency(key: string, category: ContractType, subcategory: ContractSubtype<ContractType>): this;
    addRuntimeValue(key: string): this;
    /**
     * Add a template variable dependency from the /g/ format
     * @param toReplace The text to be replaced
     * @param keyName The key name for the replacement
     */
    addTemplateVariable(toReplace: string, keyName: string): this;
    /**
     * Scan the template content for /g/ variables and add them as dependencies
     * @param templateContent The content of the template file
     */
    scanTemplateVariables(templateContent: string): this;
    /**
     * Get all dependencies for this contract
     */
    getDependencies(): Array<AddressDependency | TraitDependency | ContractDependency | RuntimeValue>;
    toRegistryEntry(): any;
}
