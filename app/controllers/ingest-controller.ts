import { Request, Response, NextFunction } from "express";
import services from "@services/index";
import { Controller } from "model";
import { Redis } from "ioredis";
import { ServiceError, ServiceErrorStatus } from "error";

export default class IngestController extends Controller {
    private serviceName: string;

    public constructor(private args: {req: Request, res: Response, next: NextFunction, redis: Redis}) {
        super(services, args.req.params.service);

        this.serviceName = args.req.params.service;
        this.exec();
    }

    private exec(): void {
        if (this.isService()) {
            this.getService()
                .exec(this.args.redis)
                .then(() => {}).catch(err => this.args.next(err))
        } else {
            this.args.next(new ServiceError(`Service ${this.serviceName} not found`, ServiceErrorStatus.NotFound));
        }
    }
}