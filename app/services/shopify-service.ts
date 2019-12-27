import { Redis } from "ioredis";
import { Service } from "../model";

export default class ShopifyService extends Service {
    public constructor() {
        super("Shopify Service");
    }

    public exec(redis: Redis): Promise<any> {
        this.log("Storing shopify products...");
        return Promise.resolve();
    }
}