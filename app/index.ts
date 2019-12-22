import fs from "fs";
import path from "path";
import { Server } from "http";
import Redis from "ioredis";
import Bluebird from "bluebird";

require("dotenv").config({
    path: path.resolve(`${process.cwd()}/.env/.env-${process.env.NODE_ENV}`)
});

const http: Server = Bluebird.promisifyAll(require("http"));

const RSA_PRIVATE_KEY_PATH: string = ".rsa/key";
const RSA_PUBLIC_KEY_PATH: string = ".rsa/key.pub";

enum RedisEventType {
    error="error",
    connect="connect",
    reconnecting="reconnection"
}

async function testRSAKeys(): Promise<boolean> {
    if (!fs.existsSync(RSA_PRIVATE_KEY_PATH) || !fs.existsSync(RSA_PUBLIC_KEY_PATH)) {
        throw new Error(`RSA key pair not found at path '${RSA_PRIVATE_KEY_PATH}, ${RSA_PUBLIC_KEY_PATH}'`);
    }

    return Promise.resolve(true);
}

async function setupRedis(): Promise<Redis.Redis> {
    const redis: Redis.Redis = new Redis({
        port: parseInt(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASS
    });

    const handler: (type: RedisEventType, err?: string) => void = (type: RedisEventType, err?: any) => {
        if (type === RedisEventType.error) {
            console.error(`Redis error occurred: ${err}`);
        } else if (type === RedisEventType.connect) {
            console.log(`Redis message connected to: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
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
        const redisInstance: Redis.Redis = await setupRedis();
    } catch(ex) {
        console.error(`Ingest Service error: ${ex.stack}`);
        process.exit(1);
    }
}

run();