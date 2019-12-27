import fs from "fs";
import Redis from "ioredis";
import express, { Request, Response, NextFunction } from "express";
import IngestController from "./controllers/ingest-controller";
import { ServiceError } from "./error";

require("dotenv").config();

const RSA_PRIVATE_KEY_PATH: string = ".rsa/key";
const RSA_PUBLIC_KEY_PATH: string = ".rsa/key.pub";
const SERVICE_PORT: number = process.env.SERVICE_PORT ? parseInt(process.env.SERVICE_PORT) : 3000;

enum RedisEventType {
    error="error",
    connect="connect",
    reconnecting="reconnection"
}

const app = express();

async function testRSAKeys(): Promise<boolean> {
    if (!fs.existsSync(RSA_PRIVATE_KEY_PATH) || !fs.existsSync(RSA_PUBLIC_KEY_PATH)) {
        throw new Error(`RSA key pair not found at path '${RSA_PRIVATE_KEY_PATH}, ${RSA_PUBLIC_KEY_PATH}'`);
    }

    return Promise.resolve(true);
}

async function setupRedis(): Promise<Redis.Redis> {
    const redisOptions: any = {
        port: parseInt(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST
    };

    if (process.env.REDIS_PASS) {
        redisOptions.password = process.env.REDIS_PASS;
    }

    const redis: Redis.Redis = new Redis(redisOptions);

    const handler: (type: RedisEventType, err?: string) => void = (type: RedisEventType, err?: any) => {
        if (type === RedisEventType.error) {
            console.error(`Redis error occurred: ${err}`);
        } else if (type === RedisEventType.connect) {
            console.log(`Redis connected to: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
        } else if (type === RedisEventType.reconnecting) {
            console.log(`Redis reconnecting to server: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
        }
    }

    redis.on("connect", () => handler(RedisEventType.connect));
    redis.on("error", (err) => handler(RedisEventType.error, err));
    redis.on("reconnecting", () => handler(RedisEventType.reconnecting));

    return redis;
}

async function run() {
    console.log("Powering up Ingest Service");
    
    try {
        await testRSAKeys();
        const redis: Redis.Redis = await setupRedis();

        app.post("/v1/api/ingest/:service", (req, res, next) => new IngestController({
            req,
            res,
            next,
            redis
        }));

        app.listen(SERVICE_PORT, () => console.log("Ingest Service listening on port %d", SERVICE_PORT));
    } catch(ex) {
        console.error(`Ingest Service error: ${ex.stack}`);
        process.exit(1);
    }
}

run();