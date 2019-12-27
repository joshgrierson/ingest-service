import { ServiceStatus } from "./model";

export class ServiceError extends Error {
    public constructor(message?: string, public status?: ServiceStatus) {
        super(message);
    }
}