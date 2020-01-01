import { Request, Response, NextFunction } from "express";
import services from "../services";
import { ServiceStatus, ServiceMethod, Controller, Service, ServiceError } from "share";
import { Redis } from "ioredis";

export default class IngestController extends Controller {
    private serviceName: string;

    public constructor(private args: {req: Request, res: Response, next: NextFunction, redis: Redis}) {
        super(args.req.path, services, args.req.params.service, args.res);

        this.serviceName = args.req.params.service;
        this.exec();
    }

    private exec(): void {
        try {
            if (this.isService()) {
                const service: Service = this.getService();

                service.setDomain("test.myshopify.com");

                this.validateBody(service)
                    .then(() => service.exec(this.args.req.body, this.args.redis))
                    .then(data => this.sendResponse(data, (this.args.req.method as ServiceMethod), ServiceStatus.OK))
                    .catch(err => this.sendResponse(err, (this.args.req.method as ServiceMethod)));
            } else {
                throw new ServiceError(`Service ${this.serviceName} not found`, ServiceStatus.NotFound);
            }
        } catch(ex) {
            this.sendResponse(ex, (this.args.req.method as ServiceMethod));
        }
    }

    private async validateBody(service: Service): Promise<string> {
        const body: Array<any> = this.args.req.body;

        if (!body || !Array.isArray(body)) {
            throw new ServiceError(`Post body requires array with schema [${Object.keys(service.schema).join()}]`, ServiceStatus.NotAcceptable);
        } else if (body && Array.isArray(body) && !service.validateSchema(body[0])) {
            throw new ServiceError(`Invalid entity schema, requires schema [${Object.keys(service.schema).join()}]`, ServiceStatus.NotAcceptable);
        } else if (body.length > 15) {
            throw new ServiceError("Entity payload is too large, cannot be larger than 15 count", ServiceStatus.Error);
        } else {
            return Promise.resolve(null);
        }
    }
}