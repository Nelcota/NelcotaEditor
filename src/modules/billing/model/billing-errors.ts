export class BillingNotConfiguredError extends Error {
    constructor(variableName: string) {
        super(`${variableName} is not set; subscriptions cannot be sold or confirmed`);
        this.name = "BillingNotConfiguredError";
    }
}

export class AsaasRequestError extends Error {
    constructor(operation: string, status: number) {
        super(`Asaas answered ${operation} with HTTP ${status}`);
        this.name = "AsaasRequestError";
    }
}
