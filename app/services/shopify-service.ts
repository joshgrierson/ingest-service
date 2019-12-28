import { Redis } from "ioredis";
import { Service, ShopifyHeaders, ShopifyTopics, ServiceStatus } from "../model";
import { Request } from "express";
import { ServiceError } from "../error";

export default class ShopifyService extends Service {
    public constructor() {
        super("Shopify Service");
    }

    public exec(redis: Redis): Promise<any> {
        this.log("Storing shopify products...");
        return Promise.resolve();
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
            return Promise.resolve();
        } else {
            throw new ServiceError("Shopify headers not valid", ServiceStatus.NotAcceptable);
        }
    }
}