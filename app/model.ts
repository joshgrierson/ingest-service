import { Redis } from "ioredis";
import { Response } from "express";
import { ServiceError } from "error";

export enum ServiceStatus {
    NotFound=404,
    OK=200
}

export enum ServiceMethod {
    POST="POST",
    GET="GET",
    PUT="PUT",
    DELETE="DELETE"
}

export interface Parser {
    parse: () => void;
}

export abstract class Service {
    public constructor(protected tag: string) {}

    protected log(message: string): void {
        console.log("%s: %s", this.tag, message);
    }

    abstract exec(redis: Redis): Promise<any>;
}

export interface Services {
    [key: string]: Service;
}

export interface ResponseOutput {
    status: ServiceStatus;
    method: ServiceMethod;
    path: string;
}

export abstract class Controller {
    public constructor(
        private path: string,
        private services: Services,
        private service: string,
        private res: Response) {}

    public isService(): boolean {
        return this.services[this.service] !== undefined;
    }

    public getService(): Service {
        return this.services[this.service];
    }

    public sendResponse(data: any, method: ServiceMethod, status?: ServiceStatus): void {
        let response: any;
        let responseStatus: ServiceStatus;

        if (data instanceof Error) {
            response = {
                error: data.message,
                meta: <ResponseOutput> {
                    status: (data as ServiceError).status,
                    method,
                    path: this.path
                }
            };

            responseStatus = (data as ServiceError).status;
            console.error(data);
        } else {
            response = {
                data,
                meta: <ResponseOutput> {
                    status,
                    method,
                    path: this.path
                }
            };

            responseStatus = status;
        }

        console.log("Path: %s\nMethod: %s\nStatus: %s", this.path, method, response.meta.status);
        this.res.status(responseStatus).send(response);
    }
}