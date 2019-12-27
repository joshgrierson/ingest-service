import { Redis } from "ioredis";

export interface Parser {
    parse: () => void;
}

export interface Service {
    exec: (redis: Redis) => Promise<any>;
}

export interface Services {
    [key: string]: Service;
}

export abstract class Controller {
    public constructor(private services: Services, private service: string) {}

    public isService(): boolean {
        return this.services[this.service] !== undefined;
    }

    public getService(): Service {
        return this.services[this.service];
    }
}