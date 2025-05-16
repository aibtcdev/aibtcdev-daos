import { ClarityVersion } from "@stacks/transactions";
import { KnownAddresses } from "../utilities/known-addresses";
import { ContractSubtype, ContractType } from "../utilities/contract-types";
import { KnownTraits } from "../utilities/known-traits";

export interface AddressDependency {
  ref: keyof KnownAddresses; // key in ADDRESSES
  key: string; // key in template
}

export interface TraitDependency {
  ref: keyof KnownTraits; // key in TRAITS
  key: string; // key in template
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
  sender: string; // address from config that deployed
  success: boolean; // deployment success status
  txId?: string; // transaction ID if successful
  address: string; // contract address after deployment
  error?: string; // error message if failed
}

export abstract class ContractBase {
  readonly name: string;
  readonly type: ContractType;
  readonly subtype: ContractSubtype<ContractType>;
  readonly deploymentOrder: number;
  readonly templatePath: string;

  protected clarityVersion: ClarityVersion | undefined;
  protected _displayName?: string;
  protected _source?: string;
  protected _hash?: string;
  protected _deploymentResult?: DeploymentResult;

  // Generate template path based on contract type
  static generateTemplatePath(type: ContractType, name: string): string {
    switch (type) {
      case "BASE":
        return `dao/${name}.clar`;
      case "ACTIONS":
        return `dao/actions/${name}.clar`;
      case "EXTENSIONS":
        return `dao/extensions/${name}.clar`;
      case "PROPOSALS":
        return `dao/proposals/${name}.clar`;
      case "TOKEN":
        return `dao/token/${name}.clar`;
      case "AGENT":
        return `agent/${name}.clar`;
      default:
        return `${name}.clar`;
    }
  }

  // Dependencies
  readonly requiredAddresses: AddressDependency[] = [];
  readonly requiredTraits: TraitDependency[] = [];
  readonly requiredContractAddresses: ContractDependency[] = [];
  readonly requiredRuntimeValues: RuntimeValue[] = [];

  constructor(
    name: string,
    type: ContractType,
    subtype: ContractSubtype<ContractType>,
    deploymentOrder: number,
    templatePath: string,
    clarityVersion?: ClarityVersion
  ) {
    this.name = name;
    this.type = type;
    this.subtype = subtype;
    this.deploymentOrder = deploymentOrder;
    this.templatePath = templatePath;
    this.clarityVersion = clarityVersion;
  }

  // Getters
  get displayName(): string | undefined {
    return this._displayName;
  }

  get source(): string | undefined {
    return this._source;
  }

  get hash(): string | undefined {
    return this._hash;
  }

  get isDeployed(): boolean {
    return !!this._deploymentResult?.success;
  }

  get deploymentResult(): DeploymentResult | undefined {
    return this._deploymentResult;
  }

  // Setters for generated content
  setDisplayName(displayName: string): this {
    this._displayName = displayName;
    return this;
  }

  setSource(source: string): this {
    this._source = source;
    return this;
  }

  setHash(hash: string): this {
    this._hash = hash;
    return this;
  }

  setDeploymentResult(result: DeploymentResult): this {
    this._deploymentResult = result;
    return this;
  }

  // Add dependencies
  addAddressDependency(ref: keyof KnownAddresses, key: string): this {
    this.requiredAddresses.push({ ref, key });
    return this;
  }

  addTraitDependency(ref: keyof KnownTraits, key: string): this {
    this.requiredTraits.push({ ref, key });
    return this;
  }

  addContractDependency(
    key: string,
    category: ContractType,
    subcategory: ContractSubtype<ContractType>
  ): this {
    this.requiredContractAddresses.push({ key, category, subcategory });
    return this;
  }

  addRuntimeValue(key: string): this {
    this.requiredRuntimeValues.push({ key });
    return this;
  }

  /**
   * Add a template variable dependency from the /g/ format
   * @param toReplace The text to be replaced
   * @param keyName The key name for the replacement
   */
  addTemplateVariable(toReplace: string, keyName: string): this {
    // Format matches the /g/toReplace/keyName format used in templates
    const formattedKey = `${toReplace}/${keyName}`;

    // Check if this is an address, trait, contract, or runtime value
    // and add to the appropriate collection
    if (toReplace.startsWith("ST") || toReplace.includes(".")) {
      // This is likely an address or contract reference
      this.addRuntimeValue(formattedKey);
    } else {
      // Other template variables (configuration values, etc.)
      this.addRuntimeValue(formattedKey);
    }

    return this;
  }

  /**
   * Scan the template content for /g/ variables and add them as dependencies
   * @param templateContent The content of the template file
   */
  scanTemplateVariables(templateContent: string): this {
    // Extract all variables from template
    const variableRegex = /;;\s*\/g\/([^\/]+)\/([^\/]+)/g;
    const matches = [...templateContent.matchAll(variableRegex)];

    // Add each unique variable as a dependency
    const uniqueVars = new Set<string>();

    for (const match of matches) {
      const toReplace = match[1];
      const keyName = match[2];
      const key = `${toReplace}/${keyName}`;

      if (!uniqueVars.has(key)) {
        uniqueVars.add(key);
        this.addTemplateVariable(toReplace, keyName);
      }
    }

    return this;
  }

  // Convert to registry entry format for backward compatibility
  /**
   * Get all dependencies for this contract
   */
  getDependencies(): Array<
    AddressDependency | TraitDependency | ContractDependency | RuntimeValue
  > {
    return [
      ...this.requiredAddresses,
      ...this.requiredTraits,
      ...this.requiredContractAddresses,
      ...this.requiredRuntimeValues,
    ];
  }

  toRegistryEntry(): any {
    const entry: any = {
      name: this.name,
      type: this.type,
      subtype: this.subtype,
      deploymentOrder: this.deploymentOrder,
      templatePath: this.templatePath,
    };

    if (this.clarityVersion) {
      entry.clarityVersion = this.clarityVersion;
    }

    if (this.requiredAddresses.length > 0) {
      entry.requiredAddresses = [...this.requiredAddresses];
    }

    if (this.requiredTraits.length > 0) {
      entry.requiredTraits = [...this.requiredTraits];
    }

    if (this.requiredContractAddresses.length > 0) {
      entry.requiredContractAddresses = [...this.requiredContractAddresses];
    }

    if (this.requiredRuntimeValues.length > 0) {
      entry.requiredRuntimeValues = [...this.requiredRuntimeValues];
    }

    if (this._source) {
      entry.source = this._source;
    }

    if (this._hash) {
      entry.hash = this._hash;
    }

    if (this._deploymentResult) {
      Object.assign(entry, this._deploymentResult);
    }

    return entry;
  }
}
