import { Redis } from "ioredis";
import { Service } from "model";

export default class ShopifyService implements Service {
    public constructor() {}

    public exec(redis: Redis): Promise<any> {}
}