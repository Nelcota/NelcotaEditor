/** A plan that cannot be rendered as sent; the message tells Claude what to fix. */
export class InvalidEditPlanError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidEditPlanError";
    }
}

/** A render job whose video lost its stored file between the plan and the render. */
export class MissingEditSourceError extends Error {
    constructor(videoId: string) {
        super(`Video ${videoId} has no stored source for the edit`);
        this.name = "MissingEditSourceError";
    }
}

export class InvalidEditJobError extends Error {
    constructor(queueName: string) {
        super(`Job of queue ${queueName} has an invalid payload`);
        this.name = "InvalidEditJobError";
    }
}
