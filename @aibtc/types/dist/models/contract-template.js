export class ContractBase {
    name;
    type;
    subtype;
    deploymentOrder;
    templatePath;
    clarityVersion;
    _source;
    _hash;
    _deploymentResult;
    // Generate template path based on contract type
    static generateTemplatePath(type, name) {
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
    requiredAddresses = [];
    requiredTraits = [];
    requiredContractAddresses = [];
    requiredRuntimeValues = [];
    constructor(name, type, subtype, deploymentOrder, templatePath, clarityVersion) {
        this.name = name;
        this.type = type;
        this.subtype = subtype;
        this.deploymentOrder = deploymentOrder;
        this.templatePath = templatePath;
        this.clarityVersion = clarityVersion;
    }
    // Getters
    get source() {
        return this._source;
    }
    get hash() {
        return this._hash;
    }
    get isDeployed() {
        return !!this._deploymentResult?.success;
    }
    get deploymentResult() {
        return this._deploymentResult;
    }
    // Setters for generated content
    setSource(source) {
        this._source = source;
        return this;
    }
    setHash(hash) {
        this._hash = hash;
        return this;
    }
    setDeploymentResult(result) {
        this._deploymentResult = result;
        return this;
    }
    // Add dependencies
    addAddressDependency(ref, key) {
        this.requiredAddresses.push({ ref, key });
        return this;
    }
    addTraitDependency(ref, key) {
        this.requiredTraits.push({ ref, key });
        return this;
    }
    addContractDependency(key, category, subcategory) {
        this.requiredContractAddresses.push({ key, category, subcategory });
        return this;
    }
    addRuntimeValue(key) {
        this.requiredRuntimeValues.push({ key });
        return this;
    }
    /**
     * Add a template variable dependency from the /g/ format
     * @param toReplace The text to be replaced
     * @param keyName The key name for the replacement
     */
    addTemplateVariable(toReplace, keyName) {
        // Format matches the /g/toReplace/keyName format used in templates
        const formattedKey = `${toReplace}/${keyName}`;
        // Check if this is an address, trait, contract, or runtime value
        // and add to the appropriate collection
        if (toReplace.startsWith("ST") || toReplace.includes(".")) {
            // This is likely an address or contract reference
            this.addRuntimeValue(formattedKey);
        }
        else {
            // Other template variables (configuration values, etc.)
            this.addRuntimeValue(formattedKey);
        }
        return this;
    }
    /**
     * Scan the template content for /g/ variables and add them as dependencies
     * @param templateContent The content of the template file
     */
    scanTemplateVariables(templateContent) {
        // Extract all variables from template
        const variableRegex = /;;\s*\/g\/([^\/]+)\/([^\/]+)/g;
        const matches = [...templateContent.matchAll(variableRegex)];
        // Add each unique variable as a dependency
        const uniqueVars = new Set();
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
    getDependencies() {
        return [
            ...this.requiredAddresses,
            ...this.requiredTraits,
            ...this.requiredContractAddresses,
            ...this.requiredRuntimeValues,
        ];
    }
    toRegistryEntry() {
        const entry = {
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
