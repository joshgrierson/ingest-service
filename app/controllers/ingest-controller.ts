import { Request, Response, NextFunction } from "express";
import services from "../services";
import { Controller, ServiceStatus, ServiceMethod } from "../model";
import { Redis } from "ioredis";
import { ServiceError } from "../error";

export default class IngestController extends Controller {
    private serviceName: string;

    public constructor(private args: {req: Request, res: Response, next: NextFunction, redis: Redis}) {
        super(args.req.path, services, args.req.params.service, args.res);

        this.serviceName = args.req.params.service;
        this.exec();
    }

    private exec(): void {
        if (this.isService()) {
            this.getService()
                .exec(this.args.redis)
                .then(() => this.sendResponse(ServiceStatus.OK, (this.args.req.method as ServiceMethod), this.response))
                .catch(err => this.args.next(err));
        } else {
            this.sendResponse(new ServiceError(`Service ${this.serviceName} not found`, ServiceStatus.NotFound), (this.args.req.method as ServiceMethod));
        }
    }

    private get response(): any {
        return {
            cached: true
        };
    }
}