import { Redis } from "ioredis";
import { Service, ServiceStatus, RedisReply, ShopifyProductBase } from "../model";
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
            results = await redis.pipeline((payload.map(p => ["hmset", `${this.domain}:${p.id}`, ...[
                "title", p.title,
                "vendor", p.vendor,
                "product_type", p.product_type
            ]]) as [])).exec().then(results => this.formatResult(payload, results));

            // if (results !== RedisReply.OK) {
            //     throw new ServiceError(`Inserting product['${payload.id}'] into redis failed`);
            // }

            console.log(results);
            this.redisSave(redis, JSON.stringify(results));

            // this.log(`Redis inserting product['${payload.id}'] status: ${result}`);
        } else {
            throw new ServiceError("Payload does not contain [id]", ServiceStatus.NotAcceptable);
        }

        return results??Promise.resolve(payload);
    }

    private formatResult(payload: Array<{[key: string]: any}>, results: Array<[Error, any]>): Promise<{}> {
        return Promise.resolve(results.reduce((acc, result, idx) => {
            const p: any = payload[idx];

            if (result[0]) {
                acc[p.id] = {
                    status: "failed",
                    err: result[0]
                };
            } else if (result[1] && result[1] === RedisReply.OK) {
                acc[p.id] = {
                    "title": p.title,
                    "vendor": p.vendor,
                    "product_type": p.product_type
                };
            }

            return acc;
        }, {}));
    }
}