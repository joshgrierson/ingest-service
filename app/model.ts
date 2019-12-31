import { Redis } from "ioredis";
import { Response, Request } from "express";
import { ServiceError } from "error";
import { IncomingHttpHeaders } from "http";

export enum ServiceStatus {
    NotFound=404,
    OK=200,
    NotAcceptable=406,
    Error=400
}

export enum ServiceMethod {
    POST="POST",
    GET="GET",
    PUT="PUT",
    DELETE="DELETE"
}

export enum RedisReply {
    OK="OK"
}

export enum ShopifyTopics {
    ProductCreate="products/create",
    ProductUpdate="products/update",
    ProductDelete="products/delete"
}

export interface ShopifyHeaders extends IncomingHttpHeaders {
    "x-shopify-topic": ShopifyTopics;
    "x-shopify-hmac-sha256": string;
    "x-shopify-shop-domain": string;
    "x-shopify-api-version": string;
}

export interface ShopifyProductBase {
    title: string;
    vendor: string;
    product_type: string;
}

export abstract class Service {
    protected domain: string;

    public constructor(protected tag: string, public schema: {[key: string]: any}) {}

    protected log(message: string): void {
        console.log("%s: %s", this.tag, message);
    }

    abstract async exec(payload: {[key: string]: any}, redis: Redis): Promise<any>;

    public validateSchema(entity: any): boolean {
        const keys: Array<string> = Object.keys(this.schema);
        const validate: Array<boolean> = [];

        keys.forEach(key => {
            if (entity[key] && typeof entity[key] === this.schema[key]) {
                validate.push(true);
            } else {
                validate.push(false);
            }
        });

        return validate.filter(v => v).length === keys.length;
    }

    protected redisSave(redis: Redis, data: any): void {
        redis.bgsave().then(saved => this.log(`${saved}\nRedis saving ['${data}']`));
    }

    public setDomain(domain: string): void {
        this.domain = domain;
    }
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
            let localStatus: ServiceStatus = (data as ServiceError).status??ServiceStatus.Error;

            response = {
                error: data.message,
                meta: <ResponseOutput> {
                    status: localStatus,
                    method,
                    path: this.path
                }
            };

            responseStatus = localStatus;
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