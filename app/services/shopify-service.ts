import { Redis } from "ioredis";
import uuidv4 from "uuid/v4";
import { Service, ServiceStatus, RedisReply } from "../model";
import { ServiceError } from "../error";

export default class ShopifyService extends Service {
    public constructor() {
        super("Shopify Service", {
            id: "number",
            title: "string",
            vendor: "string",
            product_type: "string"
        });
    }

    public async exec(payload: Array<{[key: string]: any}>, redis: Redis): Promise<any> {
        this.log("Storing shopify products...");

        let results: {};

        if (payload && payload.length > 0) {
            const redisP: [] = (payload.map(p => {
                const uuid: string = uuidv4();

                return ["hmset", `${this.domain}:${p.id}`, ...[
                    "uid", uuid,
                    "title", p.title,
                    "vendor", p.vendor,
                    "product_type", p.product_type
                ]]
            }) as []);

            results = await redis.pipeline(redisP).exec()
                .then(results => this.formatResult(payload, results, redisP.map(u => u[2])));

            if (results && Object.keys(results).filter(k => results[k].status).length === Object.keys(results).length) {
                throw new ServiceError("Inserting products into redis failed");
            }

            this.redisSave(redis, JSON.stringify(results));
        } else {
            throw new ServiceError("Payload does not contain [id]", ServiceStatus.NotAcceptable);
        }

        return results??Promise.resolve(payload);
    }

    private formatResult(payload: Array<{[key: string]: any}>, results: Array<[Error, any]>, uuids: Array<string>): Promise<{}> {
        return Promise.resolve(results.reduce((acc, result, idx) => {
            const p: any = payload[idx];

            if (result[0]) {
                acc[p.id] = {
                    status: "failed",
                    err: result[0]
                };
            } else if (result[1] && result[1] === RedisReply.OK) {
                acc[p.id] = {
                    "uid": uuids[idx],
                    "title": p.title,
                    "vendor": p.vendor,
                    "product_type": p.product_type
                };
            }

            return acc;
        }, {}));
    }
}