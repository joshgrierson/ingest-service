import { Redis } from "ioredis";
import { Service, ShopifyHeaders, ShopifyTopics, ServiceStatus, RedisReply, ShopifyProductBase } from "../model";
import { Request } from "express";
import { ServiceError } from "../error";

export default class ShopifyService extends Service {
    private shopDomain: string;

    public constructor() {
        super("Shopify Service");
    }

    public async exec(payload: {[key: string]: any}, redis: Redis): Promise<any> {
        this.log("Storing shopify products...");

        let result: any;

        if (payload && payload.id) {
            await this.validateProps(payload);

            const data: ShopifyProductBase = {
                title: payload.title,
                vendor: payload.vendor,
                product_type: payload.product_type
            };

            result = await redis.hmset(`${this.shopDomain}.${payload.id}`, data);
            this.redisSave(redis, JSON.stringify(data));

            this.log(`Redis result response: ${result}`);
        } else {
            throw new ServiceError("Payload does not contain [id]", ServiceStatus.NotAcceptable);
        }

        return result??Promise.resolve(payload);
    }

    public verify(req: Request): Promise<any> {
        const headers: ShopifyHeaders = (req.headers as ShopifyHeaders);
        const verified: {[key: string]: boolean} = {
            topicHeader: false,
            hmac: false,
            shopDomain: false,
            apiVersion: false
        };
        
        if (headers["x-shopify-topic"] && (headers["x-shopify-topic"] === ShopifyTopics.ProductCreate || headers["X-Shopify-Topic"] === ShopifyTopics.ProductUpdate)) {
            verified.topicHeader = true;
        }

        if (headers["x-shopify-hmac-sha256"]) {
            verified.hmac = true;
        }

        if (headers["x-shopify-shop-domain"] && headers["x-shopify-shop-domain"].includes(".myshopify.com")) {
            verified.shopDomain = true;
        }

        if (headers["x-shopify-api-version"] && headers["x-shopify-api-version"].match(/[0-9]{4}\-[0-9]{2}/g)) {
            verified.apiVersion = true;
        }

        if (verified.topicHeader && verified.hmac && verified.shopDomain && verified.apiVersion) {
            this.shopDomain = headers["x-shopify-shop-domain"];

            return Promise.resolve();
        } else {
            throw new ServiceError("Shopify headers not valid", ServiceStatus.NotAcceptable);
        }
    }

    private validateProps(data: any): Promise<boolean> {
        if (!data.title || data.title.length === 0) {
            throw new Error(`Entity '${data.id}' missing prop 'title'`);
        }

        if (!data.vendor || data.vendor.length === 0) {
            throw new Error(`Entity '${data.id}' missing prop 'vendor'`);
        }

        if (!data.product_type || data.product_type.length === 0) {
            throw new Error(`Entity '${data.id}' missing prop 'product_type'`);
        }

        return Promise.resolve(true);
    }
}