export enum ServiceErrorStatus {
    NotFound=404
}

export class ServiceError extends Error {
    public constructor(message?: string, public status?: ServiceErrorStatus) {
        super(message);
    }
}